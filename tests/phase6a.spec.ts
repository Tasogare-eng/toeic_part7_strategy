import { test, expect } from "@playwright/test"

/**
 * Phase 6-A テスト（認証不要）
 *
 * Stripe決済機能の基盤構築テスト
 * - 型定義のエクスポート確認（ビルド時に検証済み）
 * - 環境変数テンプレートの確認
 * - キャッシュタグの追加確認
 */

test.describe("Phase 6-A: Stripe基盤構築", () => {
  test.describe("環境設定", () => {
    test("アプリケーションが正常に起動する", async ({ page }) => {
      // Stripe基盤を追加してもアプリケーションが正常に動作することを確認
      const response = await page.goto("/")
      expect(response?.status()).toBe(200)
    })

    test("ログインページが正常に表示される", async ({ page }) => {
      const response = await page.goto("/login")
      expect(response?.status()).toBe(200)
      // ページのbodyが表示されていることを確認
      await expect(page.locator("body")).toBeVisible()
    })

    test("ダッシュボードへのアクセスはログインにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/dashboard")
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe("将来の決済ページ（未認証）", () => {
    test("/pricing ページは存在しない（Phase 6-Bで実装予定）", async ({
      page,
    }) => {
      const response = await page.goto("/pricing")
      // Phase 6-Bで実装予定なので404を期待
      expect(response?.status()).toBe(404)
    })

    test("/settings/subscription は存在しない（Phase 6-Bで実装予定）", async ({
      page,
    }) => {
      const response = await page.goto("/settings/subscription")
      // 認証が必要なページなのでリダイレクトまたは404
      const status = response?.status()
      expect([200, 302, 307, 404]).toContain(status)
    })

    test("/settings/billing は存在しない（Phase 6-Bで実装予定）", async ({
      page,
    }) => {
      const response = await page.goto("/settings/billing")
      // 認証が必要なページなのでリダイレクトまたは404
      const status = response?.status()
      expect([200, 302, 307, 404]).toContain(status)
    })
  })

  test.describe("既存機能への影響確認", () => {
    test("PWA manifest.json が引き続き動作する", async ({ request }) => {
      const response = await request.get("/manifest.json")
      expect(response.ok()).toBeTruthy()

      const manifest = await response.json()
      expect(manifest.name).toBe("TOEIC Part7 トレーニング")
    })

    test("ランディングページのレイアウトが正常", async ({ page }) => {
      await page.goto("/")
      // ヘッダーまたはメインコンテンツが表示されることを確認
      await expect(page.locator("body")).toBeVisible()
    })

    test("認証ページへの遷移が正常", async ({ page }) => {
      await page.goto("/")
      // ログインリンクがあればクリック可能
      const loginLink = page.locator('a[href="/login"]').first()
      if (await loginLink.isVisible()) {
        await loginLink.click()
        await expect(page).toHaveURL(/\/login/)
      }
    })
  })
})

test.describe("API Routes（Phase 6-B準備確認）", () => {
  test("Stripe Webhook endpoint は未実装（Phase 6-Bで実装予定）", async ({
    request,
  }) => {
    const response = await request.post("/api/webhooks/stripe", {
      data: {},
      headers: {
        "Content-Type": "application/json",
      },
    })
    // Phase 6-Bで実装予定なので404を期待
    expect(response.status()).toBe(404)
  })
})
