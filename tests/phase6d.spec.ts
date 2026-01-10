import { test, expect } from "@playwright/test"

/**
 * Phase 6-D テスト（認証不要）
 *
 * 請求・管理機能のテスト
 * - 請求履歴ページの認証リダイレクト
 * - 設定ページナビゲーション確認
 */

test.describe("Phase 6-D: 請求・管理機能（未認証）", () => {
  test.describe("請求履歴ページ", () => {
    test("/settings/billing は認証が必要でログインにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/settings/billing")
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe("設定ページ", () => {
    test("/settings は認証が必要でログインにリダイレクト", async ({ page }) => {
      await page.goto("/settings")
      await expect(page).toHaveURL(/\/login/)
    })

    test("/settings/subscription は認証が必要でログインにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/settings/subscription")
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe("既存機能への影響確認", () => {
    test("ログインページが正常に表示される", async ({ page }) => {
      const response = await page.goto("/login")
      expect(response?.status()).toBe(200)
      await expect(page.locator("body")).toBeVisible()
    })

    test("ダッシュボードは認証が必要でログインにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/dashboard")
      await expect(page).toHaveURL(/\/login/)
    })
  })
})
