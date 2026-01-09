import { test as setup, expect } from "@playwright/test"
import path from "path"

const authFile = path.join(__dirname, ".auth/user.json")

/**
 * 認証セットアップ
 *
 * テスト用ユーザーでログインし、認証状態を保存します。
 * 他のテストはこの保存された認証状態を再利用します。
 *
 * 環境変数:
 * - TEST_USER_EMAIL: テスト用ユーザーのメールアドレス
 * - TEST_USER_PASSWORD: テスト用ユーザーのパスワード
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    console.log("TEST_USER_EMAIL と TEST_USER_PASSWORD を設定してください")
    console.log("例: TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=password123 npx playwright test")
    // 環境変数がない場合はスキップ
    setup.skip()
    return
  }

  // ログインページに移動
  await page.goto("/login")

  // メールアドレスを入力
  await page.getByPlaceholder("example@email.com").fill(email)

  // パスワードを入力
  await page.getByPlaceholder("••••••••").fill(password)

  // ログインボタンをクリック
  await page.getByRole("button", { name: "ログイン", exact: true }).click()

  // ダッシュボードにリダイレクトされることを確認
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

  // 認証状態を保存
  await page.context().storageState({ path: authFile })
})
