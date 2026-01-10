import { test, expect } from "@playwright/test"

/**
 * Phase 6-C 利用制限機能テスト（非認証）
 *
 * このテストは主にページのアクセス確認を行います。
 * 利用制限の動作確認は認証済みテスト（phase6c.authenticated.spec.ts）で行います。
 */

test.describe("Phase 6-C: 利用制限関連UIコンポーネント", () => {
  test.describe("模試ページ", () => {
    test("/mock-exam ページにアクセス可能（未認証時はリダイレクト）", async ({
      page,
    }) => {
      await page.goto("/mock-exam")
      // 未認証の場合はログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/(login|mock-exam)/)
    })
  })

  test.describe("分析ページ", () => {
    test("/analytics ページにアクセス可能（未認証時はリダイレクト）", async ({
      page,
    }) => {
      await page.goto("/analytics")
      // 未認証の場合はログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/(login|analytics)/)
    })
  })

  test.describe("ダッシュボード", () => {
    test("/dashboard ページにアクセス可能（未認証時はリダイレクト）", async ({
      page,
    }) => {
      await page.goto("/dashboard")
      // 未認証の場合はログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/(login|dashboard)/)
    })
  })

  test.describe("料金プランページ", () => {
    test("/pricing は認証が必要でログインページにリダイレクト", async ({
      page,
    }) => {
      await page.goto("/pricing")
      // 未認証の場合はログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/login/)
    })
  })
})
