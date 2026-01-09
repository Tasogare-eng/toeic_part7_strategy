import { test, expect } from "@playwright/test"

/**
 * Phase 4 テスト項目（認証不要）
 *
 * 認証保護のテスト:
 * - 未認証で保護されたパスにアクセスすると /login にリダイレクト
 *
 * 認証が必要なテストは phase4.authenticated.spec.ts に記載
 *
 * 実行方法:
 * npx playwright test tests/phase4.spec.ts --project=unauthenticated
 */

test.describe("認証保護 - Phase 4", () => {
  test("未認証で /vocabulary にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/login/)
  })

  test("未認証で /vocabulary/flashcard にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/vocabulary/flashcard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("未認証で /grammar にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/login/)
  })

  test("未認証で /grammar/practice にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/grammar/practice")
    await expect(page).toHaveURL(/\/login/)
  })

  test("未認証で /review にアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.goto("/review")
    await expect(page).toHaveURL(/\/login/)
  })
})
