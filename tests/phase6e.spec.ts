import { test, expect } from "@playwright/test"

/**
 * Phase 6-E 未認証テスト - テスト・ドキュメント
 *
 * Stripe決済機能の統合テスト（未認証状態）
 *
 * 実行方法:
 * npx playwright test --project=unauthenticated tests/phase6e.spec.ts
 */

test.describe("Phase 6-E: Webhook エンドポイント", () => {
  test("Webhook エンドポイントが存在する", async ({ request }) => {
    // POSTリクエストを送信（署名なし）
    const response = await request.post("/api/webhooks/stripe", {
      data: {},
    })

    // 署名検証エラー（400）が返ることを確認
    // エンドポイントが存在しない場合は404が返る
    expect(response.status()).toBe(400)
  })

  test("不正な署名でWebhookが拒否される", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      headers: {
        "stripe-signature": "invalid_signature",
      },
      data: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: {} },
      }),
    })

    expect(response.status()).toBe(400)
  })

  test("GETリクエストは許可されない", async ({ request }) => {
    const response = await request.get("/api/webhooks/stripe")

    // Method Not Allowed または Not Found
    expect([404, 405]).toContain(response.status())
  })
})

test.describe("Phase 6-E: 料金ページ SEO", () => {
  test("料金ページにアクセスするとログインにリダイレクト", async ({
    page,
  }) => {
    await page.goto("/pricing")
    await expect(page).toHaveURL(/\/login/)
  })

  test("ログインページのタイトルが正しい", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveTitle(/TOEIC|ログイン/)
  })
})

test.describe("Phase 6-E: 決済関連ページのアクセス制御", () => {
  test("決済成功ページは認証が必要", async ({ page }) => {
    await page.goto("/payment/success")
    await expect(page).toHaveURL(/\/login/)
  })

  test("決済キャンセルページは認証が必要", async ({ page }) => {
    await page.goto("/payment/cancel")
    await expect(page).toHaveURL(/\/login/)
  })

  test("サブスクリプション設定ページは認証が必要", async ({ page }) => {
    await page.goto("/settings/subscription")
    await expect(page).toHaveURL(/\/login/)
  })

  test("請求履歴ページは認証が必要", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Phase 6-E: 学習ページのアクセス制御", () => {
  test("ダッシュボードは認証が必要", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("長文読解ページは認証が必要", async ({ page }) => {
    await page.goto("/reading")
    await expect(page).toHaveURL(/\/login/)
  })

  test("文法ページは認証が必要", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/login/)
  })

  test("単語ページは認証が必要", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/login/)
  })

  test("模試ページは認証が必要", async ({ page }) => {
    await page.goto("/mock-exam")
    await expect(page).toHaveURL(/\/login/)
  })

  test("分析ページは認証が必要", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page).toHaveURL(/\/login/)
  })

  test("復習ページは認証が必要", async ({ page }) => {
    await page.goto("/review")
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Phase 6-E: アプリケーション基盤", () => {
  test("ログインページが正常に表示される", async ({ page }) => {
    await page.goto("/login")
    await expect(
      page.getByRole("button", { name: "ログイン", exact: true })
    ).toBeVisible()
  })

  test("PWA マニフェストが存在する", async ({ request }) => {
    const response = await request.get("/manifest.json")
    expect(response.status()).toBe(200)

    const manifest = await response.json()
    expect(manifest.name).toBeTruthy()
  })

  test("サービスワーカーが登録可能", async ({ page }) => {
    await page.goto("/login")

    // Service Worker API が存在することを確認
    const hasServiceWorker = await page.evaluate(() => {
      return "serviceWorker" in navigator
    })
    expect(hasServiceWorker).toBe(true)
  })
})
