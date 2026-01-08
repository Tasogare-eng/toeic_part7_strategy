import { test, expect } from "@playwright/test"

/**
 * Phase 3 テスト項目
 *
 * ## Google認証
 * - [ ] ログイン画面にGoogleボタンが表示される
 * - [ ] 登録画面にGoogleボタンが表示される
 * - [ ] Googleボタンクリックで認証画面に遷移する
 *
 * ## 分析ページ
 * - [ ] /analytics にアクセスできる（認証後）
 * - [ ] サマリーカードが4つ表示される
 * - [ ] 正答率グラフセクションが表示される
 * - [ ] タブ切り替え（文書/設問/難易度）が機能する
 * - [ ] 弱点分析カードが表示される
 *
 * ## ナビゲーション
 * - [ ] ヘッダーに「学習分析」リンクがある
 * - [ ] ダッシュボードに「学習分析を見る」ボタンがある
 *
 * ## 認証保護
 * - [ ] 未認証で /analytics にアクセスすると /login にリダイレクト
 */

test.describe("Google認証", () => {
  test("ログイン画面にGoogleボタンが表示される", async ({ page }) => {
    await page.goto("/login")

    // Googleログインボタンが存在することを確認
    const googleButton = page.getByRole("button", { name: /google/i })
    await expect(googleButton).toBeVisible()
  })

  test("登録画面にGoogleボタンが表示される", async ({ page }) => {
    await page.goto("/register")

    // Googleログインボタンが存在することを確認
    const googleButton = page.getByRole("button", { name: /google/i })
    await expect(googleButton).toBeVisible()
  })

  test("ログイン画面に「または」区切りが表示される", async ({ page }) => {
    await page.goto("/login")

    // 「または」のテキストが存在することを確認
    await expect(page.getByText("または")).toBeVisible()
  })
})

test.describe("認証保護", () => {
  test("未認証で /analytics にアクセスすると /login にリダイレクト", async ({ page }) => {
    await page.goto("/analytics")

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/)
  })

  test("未認証で /dashboard にアクセスすると /login にリダイレクト", async ({ page }) => {
    await page.goto("/dashboard")

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("ログインページUI", () => {
  test("ログインフォームの要素が正しく表示される", async ({ page }) => {
    await page.goto("/login")

    // メールアドレス入力
    await expect(page.getByPlaceholder("example@email.com")).toBeVisible()

    // パスワード入力
    await expect(page.getByPlaceholder("••••••••")).toBeVisible()

    // ログインボタン（exactで「Googleでログイン」と区別）
    await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible()

    // 新規登録リンク
    await expect(page.getByRole("link", { name: "新規登録" })).toBeVisible()

    // Googleボタン
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible()
  })
})

test.describe("登録ページUI", () => {
  test("登録フォームの要素が正しく表示される", async ({ page }) => {
    await page.goto("/register")

    // 名前入力
    await expect(page.getByPlaceholder("山田 太郎")).toBeVisible()

    // メールアドレス入力
    await expect(page.getByPlaceholder("example@email.com")).toBeVisible()

    // パスワード入力
    await expect(page.getByPlaceholder("6文字以上")).toBeVisible()

    // 登録ボタン
    await expect(page.getByRole("button", { name: "アカウント作成" })).toBeVisible()

    // ログインリンク
    await expect(page.getByRole("link", { name: "ログイン" })).toBeVisible()

    // Googleボタン
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible()
  })
})

test.describe("ランディングページ", () => {
  test("トップページが表示される", async ({ page }) => {
    await page.goto("/")

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveURL("/")
  })
})

// 認証が必要なテストはスキップ（実際のテスト環境では認証をモックする必要がある）
test.describe.skip("分析ページ（認証必要）", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: テスト用ユーザーでログインする処理を追加
    // await loginAsTestUser(page)
  })

  test("/analytics にアクセスできる", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page).toHaveURL(/\/analytics/)
  })

  test("サマリーカードが4つ表示される", async ({ page }) => {
    await page.goto("/analytics")

    // 4つのサマリーカードを確認
    await expect(page.getByText("今週の問題数")).toBeVisible()
    await expect(page.getByText("今週の正答率")).toBeVisible()
    await expect(page.getByText("累計正答率")).toBeVisible()
    await expect(page.getByText("今週の学習時間")).toBeVisible()
  })

  test("正答率グラフセクションが表示される", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page.getByText("正答率の推移")).toBeVisible()
  })

  test("タブ切り替えが機能する", async ({ page }) => {
    await page.goto("/analytics")

    // デフォルトで文書タイプ別タブが選択されている
    await expect(page.getByRole("tab", { name: "文書タイプ別" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "設問タイプ別" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "難易度別" })).toBeVisible()

    // 設問タイプ別タブをクリック
    await page.getByRole("tab", { name: "設問タイプ別" }).click()
    await expect(page.getByText("設問タイプ別正答率")).toBeVisible()

    // 難易度別タブをクリック
    await page.getByRole("tab", { name: "難易度別" }).click()
    await expect(page.getByText("難易度別正答率")).toBeVisible()
  })

  test("弱点分析カードが表示される", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page.getByText("弱点分析")).toBeVisible()
  })
})

test.describe.skip("ナビゲーション（認証必要）", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: テスト用ユーザーでログインする処理を追加
  })

  test("ヘッダーに「学習分析」リンクがある", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "学習分析" })).toBeVisible()
  })

  test("ダッシュボードに「学習分析を見る」ボタンがある", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: /学習分析を見る/ })).toBeVisible()
  })

  test("学習分析リンクをクリックすると /analytics に遷移する", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: "学習分析" }).click()
    await expect(page).toHaveURL(/\/analytics/)
  })
})
