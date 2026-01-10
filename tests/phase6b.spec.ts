import { test, expect } from "@playwright/test"

/**
 * Phase 6-B テスト（認証不要）
 *
 * サブスクリプション機能のテスト
 * - 料金プランページの表示
 * - 決済成功/キャンセルページの表示
 * - 設定ページの認証リダイレクト
 * - Webhook endpointの存在確認
 */

test.describe("Phase 6-B: サブスクリプション機能（未認証）", () => {
  test.describe("料金プランページ", () => {
    test("/pricing は認証が必要でログインにリダイレクト", async ({ page }) => {
      await page.goto("/pricing")
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe("決済結果ページ", () => {
    test("/payment/success は認証が必要でログインにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/payment/success")
      await expect(page).toHaveURL(/\/login/)
    })

    test("/payment/cancel は認証が必要でログインにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/payment/cancel")
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

  test.describe("Stripe Webhook endpoint", () => {
    test("署名なしのリクエストは400エラー", async ({ request }) => {
      const response = await request.post("/api/webhooks/stripe", {
        data: JSON.stringify({ type: "test" }),
        headers: {
          "Content-Type": "application/json",
        },
      })
      // 署名がないので400を期待
      expect(response.status()).toBe(400)
    })

    test("GETリクエストは405エラー", async ({ request }) => {
      const response = await request.get("/api/webhooks/stripe")
      // POSTのみ対応なので405を期待
      expect(response.status()).toBe(405)
    })
  })

  test.describe("既存機能への影響確認", () => {
    test("ログインページが正常に表示される", async ({ page }) => {
      const response = await page.goto("/login")
      expect(response?.status()).toBe(200)
      await expect(page.locator("body")).toBeVisible()
    })

    test("登録ページが正常に表示される", async ({ page }) => {
      const response = await page.goto("/register")
      expect(response?.status()).toBe(200)
      await expect(page.locator("body")).toBeVisible()
    })

    test("ランディングページが正常に表示される", async ({ page }) => {
      const response = await page.goto("/")
      expect(response?.status()).toBe(200)
      await expect(page.locator("body")).toBeVisible()
    })

    test("PWA manifest.json が動作する", async ({ request }) => {
      const response = await request.get("/manifest.json")
      expect(response.ok()).toBeTruthy()
      const manifest = await response.json()
      expect(manifest.name).toBe("TOEIC Part7 トレーニング")
    })
  })
})
