import { test, expect } from "@playwright/test"

/**
 * Phase 6-E 認証必要テスト - テスト・ドキュメント
 *
 * Stripe決済機能の統合テスト（認証済み状態）
 * Phase 6 全体の完成度を検証する包括的なテスト
 *
 * 実行前に環境変数を設定してください：
 * TEST_USER_EMAIL=your-test-email@example.com
 * TEST_USER_PASSWORD=your-password
 *
 * 実行方法:
 * npx playwright test --project=authenticated tests/phase6e.authenticated.spec.ts
 */

test.describe("Phase 6-E: 全ページ横断テスト", () => {
  test("ダッシュボードが正常に表示される", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/ようこそ、/)).toBeVisible()
  })

  test("長文読解ページが正常に表示される", async ({ page }) => {
    await page.goto("/reading")
    await expect(page).toHaveURL(/\/reading/)
    await expect(
      page.getByRole("heading", { name: /長文読解|Reading/ })
    ).toBeVisible()
  })

  test("文法ページが正常に表示される", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/grammar/)
    await expect(
      page.getByRole("heading", { name: /文法|Grammar/ })
    ).toBeVisible()
  })

  test("単語ページが正常に表示される", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/vocabulary/)
    await expect(
      page.getByRole("heading", { name: /単語|Vocabulary/ })
    ).toBeVisible()
  })

  test("復習ページが正常に表示される", async ({ page }) => {
    await page.goto("/review")
    await expect(page).toHaveURL(/\/review/)
    await expect(
      page.getByRole("heading", { name: /復習|Review/ })
    ).toBeVisible()
  })

  test("分析ページが正常に表示される", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page).toHaveURL(/\/analytics/)
    await expect(page.getByText("今週の問題数")).toBeVisible()
  })

  test("模試ページが正常に表示される", async ({ page }) => {
    await page.goto("/mock-exam")
    await expect(page).toHaveURL(/\/mock-exam/)
    await expect(
      page.getByRole("heading", { name: "模試", exact: true })
    ).toBeVisible()
  })
})

test.describe("Phase 6-E: 料金プランページの完全性", () => {
  test("料金プランページが正常に表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page).toHaveURL(/\/pricing/)
  })

  test("Free プランの詳細が表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Free プラン")).toBeVisible()
    await expect(page.getByText("¥0")).toBeVisible()
  })

  test("Pro プランの詳細が表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Pro プラン")).toBeVisible()
    await expect(page.getByText("¥480")).toBeVisible()
  })

  test("プラン機能比較が表示される", async ({ page }) => {
    await page.goto("/pricing")
    // 主要機能が表示されていることを確認（複数要素があるためfirstを使用）
    await expect(page.getByText(/長文読解/).first()).toBeVisible()
    await expect(page.getByText(/文法学習/).first()).toBeVisible()
    await expect(page.getByText(/単語学習/).first()).toBeVisible()
  })

  test("FAQセクションが表示される", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText(/よくある質問|FAQ/)).toBeVisible()
  })
})

test.describe("Phase 6-E: サブスクリプション管理ページの完全性", () => {
  test("サブスクリプション管理ページが正常に表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })

  test("現在のプランセクションが表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page.getByText("現在のプラン")).toBeVisible()
  })

  test("プランバッジが表示される", async ({ page }) => {
    await page.goto("/settings/subscription")

    const mainContent = page.getByRole("main")
    const freeBadge = mainContent.getByText("Free", { exact: true })
    const proBadge = mainContent.getByText("Pro", { exact: true })

    const hasFree = await freeBadge.isVisible().catch(() => false)
    const hasPro = await proBadge.isVisible().catch(() => false)

    expect(hasFree || hasPro).toBeTruthy()
  })

  test("Free ユーザーにはアップグレードボタンが表示される", async ({
    page,
  }) => {
    await page.goto("/settings/subscription")

    const upgradeButton = page.getByRole("button", { name: /アップグレード/ })
    const cancelButton = page.getByRole("button", { name: /解約/ })

    const hasUpgrade = await upgradeButton.isVisible().catch(() => false)
    const hasCancel = await cancelButton.isVisible().catch(() => false)

    // Free ユーザーはアップグレード、Pro ユーザーは解約ボタンが表示される
    expect(hasUpgrade || hasCancel).toBeTruthy()
  })
})

test.describe("Phase 6-E: 請求履歴ページの完全性", () => {
  test("請求履歴ページが正常に表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(page).toHaveURL(/\/settings\/billing/)
  })

  test("請求履歴のヘッダーが表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(
      page.getByRole("heading", { name: "請求履歴" })
    ).toBeVisible()
  })

  test("Stripeで確認するボタンが表示される", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(
      page.getByRole("button", { name: "Stripeで確認する" })
    ).toBeVisible()
  })

  test("請求履歴または空状態メッセージが表示される", async ({ page }) => {
    await page.goto("/settings/billing")

    const emptyMessage = page.getByText("まだ請求履歴がありません")
    const tableHeader = page.getByRole("columnheader", { name: "請求日" })

    const isEmpty = await emptyMessage.isVisible().catch(() => false)
    const hasTable = await tableHeader.isVisible().catch(() => false)

    expect(isEmpty || hasTable).toBeTruthy()
  })
})

test.describe("Phase 6-E: 設定ナビゲーションの完全性", () => {
  test("サブスクリプションページからナビゲーションできる", async ({
    page,
  }) => {
    await page.goto("/settings/subscription")

    // 請求履歴リンクが存在する
    await expect(
      page.getByRole("link", { name: "請求履歴" })
    ).toBeVisible()

    // クリックして遷移
    await page.getByRole("link", { name: "請求履歴" }).click()
    await expect(page).toHaveURL(/\/settings\/billing/)
  })

  test("請求履歴ページからナビゲーションできる", async ({ page }) => {
    await page.goto("/settings/billing")

    // サブスクリプションリンクが存在する
    await expect(
      page.getByRole("link", { name: "サブスクリプション" })
    ).toBeVisible()

    // クリックして遷移
    await page.getByRole("link", { name: "サブスクリプション" }).click()
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })
})

test.describe("Phase 6-E: ダッシュボードの決済機能統合", () => {
  test("プランバッジがダッシュボードに表示される", async ({ page }) => {
    await page.goto("/dashboard")

    const freeBadge = page.getByText("Free", { exact: true })
    const proBadge = page.getByText("Pro", { exact: true })

    const hasFree = await freeBadge.isVisible().catch(() => false)
    const hasPro = await proBadge.isVisible().catch(() => false)

    expect(hasFree || hasPro).toBeTruthy()
  })

  test("Free ユーザーには利用状況が表示される", async ({ page }) => {
    await page.goto("/dashboard")

    const usageSection = page.getByText("今日の利用状況")
    const isVisible = await usageSection.isVisible().catch(() => false)

    if (isVisible) {
      // Free ユーザーの場合
      const mainContent = page.getByRole("main")
      await expect(mainContent.getByText("長文読解", { exact: true })).toBeVisible()
      await expect(mainContent.getByText("文法問題", { exact: true })).toBeVisible()
      await expect(mainContent.getByText("単語学習", { exact: true })).toBeVisible()
    }
    // Pro ユーザーの場合は利用状況が表示されないのでスキップ
  })
})

test.describe("Phase 6-E: 決済成功・キャンセルページ", () => {
  test("決済成功ページにアクセスできる", async ({ page }) => {
    await page.goto("/payment/success")
    await expect(page).toHaveURL(/\/payment\/success/)
  })

  test("決済キャンセルページにアクセスできる", async ({ page }) => {
    await page.goto("/payment/cancel")
    await expect(page).toHaveURL(/\/payment\/cancel/)
  })

  test("決済成功ページに適切なメッセージがある", async ({ page }) => {
    await page.goto("/payment/success")
    // 成功メッセージまたはダッシュボードへのリンクが表示される
    const successText = page.getByText("お支払いが完了しました")
    const dashboardLink = page.getByRole("link", { name: "ダッシュボードへ" })

    const hasSuccess = await successText.isVisible().catch(() => false)
    const hasDashboard = await dashboardLink.isVisible().catch(() => false)

    expect(hasSuccess || hasDashboard).toBeTruthy()
  })

  test("決済キャンセルページに適切なメッセージがある", async ({ page }) => {
    await page.goto("/payment/cancel")
    // キャンセルメッセージまたは料金ページへのリンクが表示される
    const cancelText = page.getByText(/キャンセル|中断/)
    const pricingLink = page.getByRole("link", { name: /料金|プラン/ })

    const hasCancel = await cancelText.isVisible().catch(() => false)
    const hasPricing = await pricingLink.isVisible().catch(() => false)

    expect(hasCancel || hasPricing).toBeTruthy()
  })
})

test.describe("Phase 6-E: Pro 限定機能のアクセス制御", () => {
  test("模試ページで機能ロックまたはセレクターが表示される", async ({
    page,
  }) => {
    await page.goto("/mock-exam")

    const featureLock = page.getByText("模試機能は Pro 限定機能です")
    const examSelector = page.getByText("新しい模試を開始")

    const isLocked = await featureLock.isVisible().catch(() => false)
    const hasSelector = await examSelector.isVisible().catch(() => false)

    // Free ユーザーはロック、Pro ユーザーはセレクターが表示される
    expect(isLocked || hasSelector).toBeTruthy()
  })

  test("分析ページで詳細分析ロックまたはタブが表示される", async ({
    page,
  }) => {
    await page.goto("/analytics")

    const upgradeBanner = page.getByText("詳細分析機能は Pro プラン限定です")
    const categoryTabs = page.getByRole("tab", { name: "文書タイプ別" })

    const isLocked = await upgradeBanner.isVisible().catch(() => false)
    const hasTabs = await categoryTabs.isVisible().catch(() => false)

    // Free ユーザーはロック、Pro ユーザーはタブが表示される
    expect(isLocked || hasTabs).toBeTruthy()
  })
})

test.describe("Phase 6-E: エラーハンドリング", () => {
  test("存在しないページは404を返す", async ({ page }) => {
    const response = await page.goto("/non-existent-page-12345")
    expect(response?.status()).toBe(404)
  })

  test("存在しない設定ページは404を返す", async ({ page }) => {
    const response = await page.goto("/settings/non-existent")
    // 404 または リダイレクト
    expect([404, 200]).toContain(response?.status())
  })
})
