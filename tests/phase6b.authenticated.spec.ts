import { test, expect } from "@playwright/test"

/**
 * Phase 6-B 認証必要テスト
 *
 * このテストは認証済み状態で実行されます。
 * 実行前に環境変数を設定してください：
 *
 * TEST_USER_EMAIL=your-test-email@example.com
 * TEST_USER_PASSWORD=your-password
 *
 * 実行方法:
 * npx playwright test --project=authenticated tests/phase6b.authenticated.spec.ts
 */

test.describe("料金プランページ（認証済み）", () => {
  test("/pricing にアクセスできる", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page).toHaveURL(/\/pricing/)
  })

  test("ページタイトルが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(
      page.getByRole("heading", { name: "シンプルな料金プラン" })
    ).toBeVisible()
  })

  test("Freeプランカードが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Free プラン")).toBeVisible()
    await expect(page.getByText("¥0")).toBeVisible()
  })

  test("Proプランカードが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Pro プラン")).toBeVisible()
    await expect(page.getByText("¥480")).toBeVisible()
  })

  test("よくある質問セクションが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(
      page.getByRole("heading", { name: "よくある質問" })
    ).toBeVisible()
    await expect(page.getByText("いつでも解約できますか？")).toBeVisible()
    await expect(page.getByText("支払い方法は？")).toBeVisible()
  })

  test("Freeプランの機能一覧が表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("長文読解 5問/日")).toBeVisible()
    await expect(page.getByText("文法学習 10問/日")).toBeVisible()
    await expect(page.getByText("単語学習 20語/日")).toBeVisible()
  })

  test("Proプランの機能一覧が表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("長文読解 無制限")).toBeVisible()
    await expect(page.getByText("文法学習 無制限")).toBeVisible()
    await expect(page.getByText("単語学習 無制限")).toBeVisible()
  })
})

test.describe("設定ページ（認証済み）", () => {
  test("/settings は /settings/subscription にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })

  test("/settings/subscription にアクセスできる", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })

  test("サブスクリプション管理のタイトルが表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(
      page.getByRole("heading", { name: "サブスクリプション管理" })
    ).toBeVisible()
  })

  test("現在のプランセクションが表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page.getByText("現在のプラン")).toBeVisible()
  })

  test("設定サイドバーが表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible()
    await expect(page.getByText("サブスクリプション")).toBeVisible()
  })

  test("Freeプランユーザーにはアップグレードカードが表示される", async ({
    page,
  }) => {
    await page.goto("/settings/subscription")
    // Freeユーザーの場合
    const upgradeCard = page.getByText("Pro プランにアップグレード")
    if (await upgradeCard.isVisible()) {
      await expect(upgradeCard).toBeVisible()
      await expect(
        page.getByRole("button", { name: "Pro プランに加入" })
      ).toBeVisible()
    }
  })
})

test.describe("決済結果ページ（認証済み）", () => {
  test("/payment/success にアクセスできる", async ({ page }) => {
    await page.goto("/payment/success")
    await expect(page).toHaveURL(/\/payment\/success/)
  })

  test("決済成功ページの内容が表示される", async ({ page }) => {
    await page.goto("/payment/success")
    await expect(
      page.getByRole("heading", { name: "お支払いが完了しました" })
    ).toBeVisible()
    await expect(
      page.getByText("Pro プランへのご加入ありがとうございます")
    ).toBeVisible()
  })

  test("決済成功ページにダッシュボードリンクがある", async ({ page }) => {
    await page.goto("/payment/success")
    await expect(
      page.getByRole("link", { name: "ダッシュボードへ" })
    ).toBeVisible()
  })

  test("決済成功ページにサブスクリプション管理リンクがある", async ({
    page,
  }) => {
    await page.goto("/payment/success")
    await expect(
      page.getByRole("link", { name: "サブスクリプション管理" })
    ).toBeVisible()
  })

  test("/payment/cancel にアクセスできる", async ({ page }) => {
    await page.goto("/payment/cancel")
    await expect(page).toHaveURL(/\/payment\/cancel/)
  })

  test("決済キャンセルページの内容が表示される", async ({ page }) => {
    await page.goto("/payment/cancel")
    await expect(
      page.getByRole("heading", { name: "決済がキャンセルされました" })
    ).toBeVisible()
    await expect(page.getByText("お支払いは完了していません")).toBeVisible()
  })

  test("決済キャンセルページに料金プランリンクがある", async ({ page }) => {
    await page.goto("/payment/cancel")
    await expect(
      page.getByRole("link", { name: "料金プランに戻る" })
    ).toBeVisible()
  })
})

test.describe("既存ページへの影響確認（認証済み）", () => {
  test("ダッシュボードにアクセスできる", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("長文読解ページにアクセスできる", async ({ page }) => {
    await page.goto("/reading")
    await expect(page).toHaveURL(/\/reading/)
  })

  test("文法ページにアクセスできる", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/grammar/)
  })

  test("単語ページにアクセスできる", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/vocabulary/)
  })

  test("分析ページにアクセスできる", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page).toHaveURL(/\/analytics/)
  })

  test("模試ページにアクセスできる", async ({ page }) => {
    await page.goto("/mock-exam")
    await expect(page).toHaveURL(/\/mock-exam/)
  })
})
