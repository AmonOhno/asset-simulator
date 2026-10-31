import { test, expect, signIn } from './fixtures';

test.describe('デスクトップ UI（PC / タブレット）', () => {
  test('未ログイン時はログインフォームを表示する', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    // ログイン前にアプリ本体は表示しない
    await expect(page.getByRole('heading', { name: '会計＆資産シミュレーター' })).toHaveCount(0);
  });

  test.describe('ログイン後', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: '会計＆資産シミュレーター' })).toBeVisible();
    });

    test('主要タブを切り替えられる', async ({ page }) => {
      const tabs = page.locator('.nav-tabs');

      await tabs.getByRole('button', { name: 'イベント入力' }).click();
      await expect(tabs.getByRole('button', { name: 'イベント入力' })).toHaveClass(/active/);

      const menu = tabs.locator('.dropdown-menu');
      for (const name of ['ダッシュボード', '定期取引', '勘定科目管理', '取引入力']) {
        // React の再レンダーでトグルの className が上書きされ Bootstrap の `show` が外れるため、
        // 遷移によっては項目クリック後もメニューが開いたまま残る（既知の UI 挙動）。
        // ユーザー操作と同じく、閉じているときだけトグルで開く。
        if (!(await menu.isVisible())) {
          await tabs.getByRole('button', { name: 'Toggle dropdown' }).click();
        }
        await expect(menu).toBeVisible();
        await menu.getByRole('button', { name, exact: true }).click();
        // クリック後はドロップダウンが閉じ role 検索の対象外になるため、CSS で選択状態を確認する
        await expect(tabs.locator('.dropdown-item', { hasText: new RegExp(`^${name}$`) })).toHaveClass(/active/);
      }
    });

    test('ログアウトするとログインフォームに戻る', async ({ page }) => {
      await page.getByRole('button', { name: 'ログアウト' }).click();
      await expect(page.getByLabel('Email address')).toBeVisible();
    });
  });
});
