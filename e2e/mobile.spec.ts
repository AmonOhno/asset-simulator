import { test, expect, signIn } from './fixtures';

test.describe('モバイル UI（スマートフォン）', () => {
  test('未ログイン時はログイン画面を表示する', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '会計＆資産シミュレーター' })).toBeVisible();
    await expect(page.getByText('ログインしてください')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test.describe('ログイン後', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: '取引管理ダッシュボード' })).toBeVisible();
    });

    test('下部タブを切り替えられる', async ({ page }) => {
      const nav = page.locator('nav');
      for (const name of ['PL/BS', '定期取引', '勘定科目', '取引']) {
        await nav.getByRole('button', { name, exact: true }).click();
        await expect(nav.getByRole('button', { name, exact: true })).toHaveCSS('font-weight', '600');
      }
    });

    test('ログアウトするとログイン画面に戻る', async ({ page }) => {
      await page.getByRole('button', { name: 'ログアウト' }).click();
      await expect(page.getByText('ログインしてください')).toBeVisible();
    });
  });
});
