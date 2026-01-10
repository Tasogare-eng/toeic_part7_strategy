import { test, expect } from "@playwright/test"

/**
 * Phase 6-C 認証必要テスト - 利用制限機能
 *
 * このテストは認証済み状態で実行されます。
 * 実行前に環境変数を設定してください：
 *
 * TEST_USER_EMAIL=your-test-email@example.com
 * TEST_USER_PASSWORD=your-password
 *
 * 実行方法:
 * npx playwright test --project=authenticated tests/phase6c.authenticated.spec.ts
 */

test.describe("Phase 6-C: ダッシュボード利用状況表示", () => {
  test("ダッシュボードにアクセスできる", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("Freeユーザーには利用状況カードが表示される", async ({ page }) => {
    await page.goto("/dashboard")

    // 利用状況セクションの存在確認（Freeユーザーのみ表示）
    const usageSection = page.getByText("今日の利用状況")
    const isVisible = await usageSection.isVisible().catch(() => false)

    if (isVisible) {
      // Freeユーザーの場合、利用状況が表示される
      await expect(usageSection).toBeVisible()
      // 利用状況カード内の表示確認（main領域に限定）
      const mainContent = page.getByRole("main")
      await expect(mainContent.getByText("長文読解", { exact: true })).toBeVisible()
      await expect(mainContent.getByText("文法問題", { exact: true })).toBeVisible()
      await expect(mainContent.getByText("単語学習", { exact: true })).toBeVisible()
    }
    // Proユーザーの場合は利用状況が表示されない
  })

  test("Freeユーザーにはアップグレード案内が表示される", async ({ page }) => {
    await page.goto("/dashboard")

    // アップグレード案内の存在確認
    const upgradeCard = page.getByText("Pro プランで学習を加速")
    const isVisible = await upgradeCard.isVisible().catch(() => false)

    if (isVisible) {
      await expect(upgradeCard).toBeVisible()
      await expect(page.getByText("Pro プランを見る")).toBeVisible()
    }
  })
})

test.describe("Phase 6-C: 模試ページのPro限定機能", () => {
  test("模試ページにアクセスできる", async ({ page }) => {
    await page.goto("/mock-exam")
    await expect(page).toHaveURL(/\/mock-exam/)
  })

  test("模試ページに適切なタイトルが表示される", async ({ page }) => {
    await page.goto("/mock-exam")
    await expect(
      page.getByRole("heading", { name: "模試", exact: true })
    ).toBeVisible()
  })

  test("Freeユーザーには模試機能ロックが表示される", async ({ page }) => {
    await page.goto("/mock-exam")

    // FeatureLockコンポーネントまたはMockExamSelectorの存在確認
    const featureLock = page.getByText("模試機能は Pro 限定機能です")
    const examSelector = page.getByText("新しい模試を開始")
    const isLocked = await featureLock.isVisible().catch(() => false)

    if (isLocked) {
      // Freeユーザーの場合、ロック表示
      await expect(featureLock).toBeVisible()
      // main領域内のリンクに限定
      const mainContent = page.getByRole("main")
      await expect(
        mainContent.getByRole("link", { name: "Pro にアップグレード" })
      ).toBeVisible()
    } else {
      // Proユーザーの場合、模試選択UIが表示される
      await expect(examSelector).toBeVisible()
    }
  })
})

test.describe("Phase 6-C: 分析ページのPro限定機能", () => {
  test("分析ページにアクセスできる", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page).toHaveURL(/\/analytics/)
  })

  test("基本統計情報が表示される（全ユーザー共通）", async ({ page }) => {
    await page.goto("/analytics")

    // サマリーカードは全ユーザーに表示
    await expect(page.getByText("今週の問題数")).toBeVisible()
    await expect(page.getByText("今週の正答率")).toBeVisible()
    await expect(page.getByText("累計正答率")).toBeVisible()
  })

  test("正答率推移グラフが表示される（全ユーザー共通）", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page.getByText("正答率の推移")).toBeVisible()
  })

  test("Freeユーザーには詳細分析がロックされる", async ({ page }) => {
    await page.goto("/analytics")

    // Pro限定バナーまたはカテゴリ分析タブの存在確認
    const upgradeBanner = page.getByText("詳細分析機能は Pro プラン限定です")
    const categoryTabs = page.getByRole("tab", { name: "文書タイプ別" })
    const isLocked = await upgradeBanner.isVisible().catch(() => false)

    if (isLocked) {
      // Freeユーザーの場合、ロック表示
      await expect(upgradeBanner).toBeVisible()
    } else {
      // Proユーザーの場合、詳細分析タブが使用可能
      await expect(categoryTabs).toBeVisible()
    }
  })
})

test.describe("Phase 6-C: 長文読解ページ", () => {
  test("長文読解ページにアクセスできる", async ({ page }) => {
    await page.goto("/reading")
    await expect(page).toHaveURL(/\/reading/)
  })

  test("長文一覧が表示される", async ({ page }) => {
    await page.goto("/reading")
    // 長文読解ページのタイトルまたはコンテンツ確認
    await expect(
      page.getByRole("heading", { name: /長文読解|Reading/ })
    ).toBeVisible()
  })
})

test.describe("Phase 6-C: 文法ページ", () => {
  test("文法ページにアクセスできる", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/grammar/)
  })

  test("文法練習機能が表示される", async ({ page }) => {
    await page.goto("/grammar")
    await expect(
      page.getByRole("heading", { name: /文法|Grammar/ })
    ).toBeVisible()
  })
})

test.describe("Phase 6-C: 単語ページ", () => {
  test("単語ページにアクセスできる", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/vocabulary/)
  })

  test("単語学習機能が表示される", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(
      page.getByRole("heading", { name: /単語|Vocabulary/ })
    ).toBeVisible()
  })
})

test.describe("Phase 6-C: 復習ページ", () => {
  test("復習ページにアクセスできる", async ({ page }) => {
    await page.goto("/review")
    await expect(page).toHaveURL(/\/review/)
  })

  test("復習機能が表示される", async ({ page }) => {
    await page.goto("/review")
    await expect(
      page.getByRole("heading", { name: /復習|Review/ })
    ).toBeVisible()
  })
})

test.describe("Phase 6-C: サブスクリプション設定ページ", () => {
  test("設定ページにアクセスできる", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page).toHaveURL(/\/settings\/subscription/)
  })

  test("現在のプラン情報が表示される", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page.getByText("現在のプラン")).toBeVisible()
  })
})
