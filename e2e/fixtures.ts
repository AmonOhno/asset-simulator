import { test as base, expect, type Page } from '@playwright/test';

// playwright.config.ts の REACT_APP_SUPABASE_URL と揃える
export const SUPABASE_URL = 'https://e2e.supabase.test';
// supabase-js v2 の既定ストレージキー: sb-<hostname の先頭ラベル>-auth-token
const AUTH_STORAGE_KEY = 'sb-e2e-auth-token';

export const E2E_USER_ID = '00000000-0000-4000-8000-000000000001';

function base64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** 署名なしのダミー JWT（クライアント側で検証されないため形式だけ整える） */
function fakeAccessToken(expiresAt: number): string {
  return [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ sub: E2E_USER_ID, role: 'authenticated', aud: 'authenticated', exp: expiresAt }),
    'e2e-signature',
  ].join('.');
}

const fakeUser = {
  id: E2E_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'e2e@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

/**
 * Supabase へのリクエストを全てモックする。
 * - REST / RPC: 空配列（データ 0 件の新規ユーザー相当）
 * - Auth: ログアウト等は 204、ユーザー取得はダミーユーザー
 * アプリ外部（127.0.0.1 以外）への通信は Supabase 以外すべて遮断し、
 * 想定外の外部依存が増えたらテストで気づけるようにする。
 */
async function mockSupabase(page: Page, unexpected: string[]) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.origin !== SUPABASE_URL) {
      unexpected.push(route.request().url());
      return route.abort();
    }
    const method = route.request().method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });
    if (url.pathname.startsWith('/rest/v1/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (url.pathname === '/auth/v1/user') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeUser) });
    }
    if (url.pathname.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204 });
    unexpected.push(`${method} ${route.request().url()}`);
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

/** ログイン済みセッションを localStorage に仕込む（OAuth 画面を経由せずにログイン後画面を検証するため） */
export async function signIn(page: Page) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: fakeAccessToken(expiresAt),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: 'e2e-refresh-token',
    user: fakeUser,
  };
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [AUTH_STORAGE_KEY, JSON.stringify(session)] as const,
  );
}

type Fixtures = { pageErrors: string[]; unexpectedRequests: string[] };

/**
 * 全テスト共通: Supabase をモックし、未捕捉の JS 例外・想定外の通信が無いことを最後に検証する。
 */
export const test = base.extend<Fixtures>({
  unexpectedRequests: async ({ page }, use) => {
    const unexpected: string[] = [];
    await mockSupabase(page, unexpected);
    await use(unexpected);
    expect(unexpected, '想定外の外部通信').toEqual([]);
  },
  pageErrors: [
    async ({ page, unexpectedRequests: _ }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await use(errors);
      expect(errors, '未捕捉の JS 例外').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
