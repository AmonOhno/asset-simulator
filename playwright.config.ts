import { defineConfig, devices } from '@playwright/test';

// E2E は client/（本番デプロイ対象の Vite エントリー）をビルドし、vite preview で配信して実行する。
// Supabase への通信は e2e/fixtures.ts で全てモックするため、ダミーの URL / キーを渡す。
// （*.test は予約 TLD で実在しない。万一モック漏れがあっても外部へは到達しない）
const PORT = 4173;
const E2E_SUPABASE_URL = 'https://e2e.supabase.test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 「全件パス」を厳密に判定するため、リトライで通った flaky も合格扱いにしない
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // PC/タブレット判定 → desktop/ の UI
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, testMatch: /desktop\.spec\.ts/ },
    // スマートフォン判定（iPhone UA）→ mobile/app の UI。ブラウザエンジンは CI で入れる chromium を使う
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run build --prefix client && npm run preview --prefix client -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      REACT_APP_SUPABASE_URL: E2E_SUPABASE_URL,
      REACT_APP_SUPABASE_ANON_KEY: 'e2e-dummy-anon-key',
    },
  },
});
