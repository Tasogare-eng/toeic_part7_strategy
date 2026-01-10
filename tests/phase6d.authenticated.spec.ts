import { test, expect } from "@playwright/test"

/**
 * Phase 6-D 認証必要テスト - 請求・管理機能
 *
 * このテストは認証済み状態で実行されます。
 * 実行前に環境変数を設定してください：
 *
 * TEST_USER_EMAIL=your-test-email@example.com
 * TEST_USER_PASSWORD=your-password
 *
 * 実行方法:
 * npx playwright test --project=authenticated tests/phase6d.authenticated.spec.ts
 */

test.describe("Phase 6-D: 請求履歴ページ", () => {
  test("請求履歴ページにアクセスできる", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(page).toHaveURL(/\/settings\/billing/)
  })

  test("請求履歴ページのタイトルが表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(
      page.getByRole("heading", { name: "請求履歴" })
    ).toBeVisible()
  })

  test("請求履歴ページの説明が表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(
      page.getByText("過去の請求と領収書を確認できます")
    ).toBeVisible()
  })

  test("請求履歴カードが表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    // 請求履歴セクション（カード）
    await expect(page.getByText("過去12件の請求履歴を表示しています")).toBeVisible()
  })

  test("Stripeで確認するボタンが表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(
      page.getByRole("button", { name: "Stripeで確認する" })
    ).toBeVisible()
  })

  test("請求履歴が空の場合、適切なメッセージが表示される", async ({ page }) => {
    await page.goto("/settings/billing")

    // 請求履歴がある場合はテーブル、ない場合は空メッセージ
    const emptyMessage = page.getByText("まだ請求履歴がありません")
    const tableHeader = page.getByRole("columnheader", { name: "請求日" })

    const isEmpty = await emptyMessage.isVisible().catch(() => false)
    const hasTable = await tableHeader.isVisible().catch(() => false)

    // どちらかが表示されていればOK
    expect(isEmpty || hasTable).toBeTruthy()
  })
})

test.describe("Phase 6-D: 設定ナビゲーション", () => {
  test("設定ページにサブスクリプションリンクがある", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(
      page.getByRole("link", { name: "サブスクリプション" })
    ).toBeVisible()
  })

  test("設定ページに請求履歴リンクがある", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(
      page.getByRole("link", { name: "請求履歴" })
    ).toBeVisible()
  })

  test("サブスクリプションリンクをクリックすると遷移する", async ({ page }) => {
    await page.goto("/settings/billing")
    await page.getByRole("link", { name: "サブスクリプション" }).click()
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })

  test("請求履歴リンクをクリックすると遷移する", async ({ page }) => {
    await page.goto("/settings/subscription")
    await page.getByRole("link", { name: "請求履歴" }).click()
    await expect(page).toHaveURL(/\/settings\/billing/)
  })
})

test.describe("Phase 6-D: ダッシュボードのプランバッジ", () => {
  test("ダッシュボードにアクセスできる", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("ダッシュボードにプランバッジが表示される", async ({ page }) => {
    await page.goto("/dashboard")

    // Free または Pro のバッジが表示される
    const freeBadge = page.getByText("Free", { exact: true })
    const proBadge = page.getByText("Pro", { exact: true })

    const hasFree = await freeBadge.isVisible().catch(() => false)
    const hasPro = await proBadge.isVisible().catch(() => false)

    // どちらかのバッジが表示されていればOK
    expect(hasFree || hasPro).toBeTruthy()
  })

  test("ダッシュボードのウェルカムメッセージが表示される", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText(/ようこそ、/)).toBeVisible()
  })
})

test.describe("Phase 6-D: サブスクリプション管理ページ", () => {
  test("サブスクリプション管理ページにアクセスできる", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })

  test("現在のプラン情報が表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page.getByText("現在のプラン")).toBeVisible()
  })

  test("プラン名が表示される", async ({ page }) => {
    await page.goto("/settings/subscription")

    // Free または Pro バッジの表示確認
    const freeBadge = page.getByRole("main").getByText("Free", { exact: true })
    const proBadge = page.getByRole("main").getByText("Pro", { exact: true })

    const hasFree = await freeBadge.isVisible().catch(() => false)
    const hasPro = await proBadge.isVisible().catch(() => false)

    expect(hasFree || hasPro).toBeTruthy()
  })
})

test.describe("Phase 6-D: 料金プランページ", () => {
  test("料金プランページにアクセスできる", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page).toHaveURL(/\/pricing/)
  })

  test("Free プランカードが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Free プラン")).toBeVisible()
  })

  test("Pro プランカードが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Pro プラン")).toBeVisible()
  })

  test("Pro プランの価格が表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("¥480")).toBeVisible()
  })
})
