import { test, expect } from "@playwright/test"

/**
 * Phase 5 テスト（認証不要）
 *
 * 模試機能のパブリックページ、PWA設定のテスト
 */

test.describe("PWA設定", () => {
  test("manifest.json が存在する", async ({ page }) => {
    const response = await page.goto("/manifest.json")
    expect(response?.status()).toBe(200)
  })

  test("manifest.json の内容が正しい", async ({ request }) => {
    const response = await request.get("/manifest.json")
    expect(response.ok()).toBeTruthy()

    const manifest = await response.json()
    expect(manifest.name).toBe("TOEIC Part7 トレーニング")
    expect(manifest.short_name).toBe("TOEIC学習")
    expect(manifest.start_url).toBe("/dashboard")
    expect(manifest.display).toBe("standalone")
    expect(manifest.theme_color).toBe("#3b82f6")
  })

  test("HTMLにmanifestリンクがある", async ({ page }) => {
    await page.goto("/")
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json")
  })

  test("theme-colorがmanifest.jsonで設定されている", async ({ request }) => {
    // Next.js 15+ではthemeColorはviewport exportに移行されたため、
    // manifest.jsonでの設定を確認する
    const response = await request.get("/manifest.json")
    const manifest = await response.json()
    expect(manifest.theme_color).toBe("#3b82f6")
  })
})

test.describe("模試ページ（未認証）", () => {
  test("/mock-exam にアクセスするとログインにリダイレクト", async ({ page }) => {
    await page.goto("/mock-exam")
    await expect(page).toHaveURL(/\/login/)
  })

  test("/mock-exam/history にアクセスするとログインにリダイレクト", async ({
    page,
  }) => {
    await page.goto("/mock-exam/history")
    await expect(page).toHaveURL(/\/login/)
  })
})
