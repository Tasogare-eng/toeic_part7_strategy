import { test, expect } from "@playwright/test"

/**
 * Phase 4 認証必要テスト
 *
 * このテストは認証済み状態で実行されます。
 * 実行前に環境変数を設定してください：
 *
 * TEST_USER_EMAIL=your-test-email@example.com
 * TEST_USER_PASSWORD=your-password
 *
 * 実行方法:
 * npx playwright test --project=authenticated
 */

test.describe("単語学習ページ", () => {
  test("/vocabulary にアクセスできる", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/vocabulary/)
  })

  test("ページタイトルが表示される", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page.getByRole("heading", { name: "単語学習" })).toBeVisible()
  })

  test("統計カードが表示される", async ({ page }) => {
    await page.goto("/vocabulary")

    // 統計カードのタイトルを確認（exact matchを使用）
    await expect(page.getByText("総単語数", { exact: true })).toBeVisible()
    await expect(page.getByText("習得済み", { exact: true })).toBeVisible()
    await expect(page.getByText("要復習", { exact: true })).toBeVisible()
  })

  test("レベル別タブが表示される", async ({ page }) => {
    await page.goto("/vocabulary")

    await expect(page.getByRole("tab", { name: "すべて" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "600点" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "700点" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "800点" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "900点" })).toBeVisible()
  })

  test("「学習を開始」ボタンが表示される", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page.getByRole("link", { name: /学習を開始/ })).toBeVisible()
  })

  test("単語一覧セクションが表示される", async ({ page }) => {
    await page.goto("/vocabulary")
    await expect(page.getByText("単語一覧")).toBeVisible()
  })

  test("レベルタブをクリックするとURLが変わる", async ({ page }) => {
    await page.goto("/vocabulary")

    await page.getByRole("tab", { name: "700点" }).click()
    await expect(page).toHaveURL(/level=2/)
  })

  test("「学習を開始」をクリックするとフラッシュカードページに遷移", async ({
    page,
  }) => {
    await page.goto("/vocabulary")

    await page.getByRole("link", { name: /学習を開始/ }).click()
    await expect(page).toHaveURL(/\/vocabulary\/flashcard/)
  })
})

test.describe("フラッシュカードページ", () => {
  test("/vocabulary/flashcard にアクセスできる", async ({ page }) => {
    await page.goto("/vocabulary/flashcard")
    await expect(page).toHaveURL(/\/vocabulary\/flashcard/)
  })

  test("進捗表示がある", async ({ page }) => {
    await page.goto("/vocabulary/flashcard")
    // 進捗表示（1 / N 形式）を確認
    await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible()
  })

  test("進捗バーが表示される", async ({ page }) => {
    await page.goto("/vocabulary/flashcard")
    await expect(page.getByRole("progressbar")).toBeVisible()
  })
})

test.describe("文法学習ページ", () => {
  test("/grammar にアクセスできる", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/grammar/)
  })

  test("ページタイトルが表示される", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page.getByRole("heading", { name: "文法学習" })).toBeVisible()
  })

  test("統計カードが表示される", async ({ page }) => {
    await page.goto("/grammar")

    // 統計カードのタイトルを確認（exact matchを使用）
    await expect(page.getByText("総問題数", { exact: true })).toBeVisible()
    await expect(page.getByText("解答数", { exact: true })).toBeVisible()
    await expect(page.getByText("平均解答時間", { exact: true })).toBeVisible()
  })

  test("カテゴリ別正答率セクションが表示される", async ({ page }) => {
    await page.goto("/grammar")
    // データがある場合は「カテゴリ別正答率」、ない場合は「まだ解答データがありません」
    const hasSection = await page.getByText("カテゴリ別正答率").isVisible().catch(() => false)
    const hasEmptyMessage = await page.getByText("まだ解答データがありません").isVisible().catch(() => false)
    expect(hasSection || hasEmptyMessage).toBeTruthy()
  })

  test("カテゴリ別練習セクションが表示される", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page.getByText("カテゴリ別練習")).toBeVisible()
  })

  test("「練習を開始」ボタンが表示される", async ({ page }) => {
    await page.goto("/grammar")
    await expect(page.getByRole("link", { name: /練習を開始/ })).toBeVisible()
  })

  test("文法カテゴリが表示される", async ({ page }) => {
    await page.goto("/grammar")

    // 主要なカテゴリが表示されることを確認
    await expect(page.getByText("品詞")).toBeVisible()
    await expect(page.getByText("時制")).toBeVisible()
    await expect(page.getByText("関係詞")).toBeVisible()
  })
})

test.describe("文法練習ページ", () => {
  test("/grammar/practice にアクセスできる", async ({ page }) => {
    await page.goto("/grammar/practice")
    await expect(page).toHaveURL(/\/grammar\/practice/)
  })

  test("進捗バーまたは空メッセージが表示される", async ({ page }) => {
    await page.goto("/grammar/practice")
    // 問題がある場合はprogressbar、ない場合は空メッセージ
    const hasProgressBar = await page.getByRole("progressbar").isVisible().catch(() => false)
    const hasEmptyMessage = await page.getByText(/練習する問題がありません/).isVisible().catch(() => false)
    expect(hasProgressBar || hasEmptyMessage).toBeTruthy()
  })

  test("問題があれば選択肢が4つ表示される", async ({ page }) => {
    await page.goto("/grammar/practice")
    const radioButtons = page.getByRole("radio")
    const count = await radioButtons.count()
    // 問題がある場合は4つ、ない場合は0
    expect(count === 4 || count === 0).toBeTruthy()
  })

  test("問題があればタイマーが表示される", async ({ page }) => {
    await page.goto("/grammar/practice")
    // ページのロードを待機
    await page.waitForLoadState("networkidle")
    // タイマーの時間表示を確認（0:00形式）または問題がない場合
    const hasTimer = await page.getByText(/\d+:\d{2}/).first().isVisible().catch(() => false)
    const hasEmptyMessage = await page.getByText(/練習する問題がありません/).isVisible().catch(() => false)
    expect(hasTimer || hasEmptyMessage).toBeTruthy()
  })

  test("問題があれば「回答する」ボタンが表示される", async ({ page }) => {
    await page.goto("/grammar/practice")
    const hasButton = await page.getByRole("button", { name: "回答する" }).isVisible().catch(() => false)
    const hasEmptyMessage = await page.getByText(/練習する問題がありません/).isVisible().catch(() => false)
    expect(hasButton || hasEmptyMessage).toBeTruthy()
  })

  test("問題があれば選択肢を選んで回答できる", async ({ page }) => {
    await page.goto("/grammar/practice")

    const radioButtons = page.getByRole("radio")
    const count = await radioButtons.count()

    if (count > 0) {
      // 最初の選択肢を選択
      await radioButtons.first().click()

      // 回答ボタンをクリック
      await page.getByRole("button", { name: "回答する" }).click()

      // 結果が表示される（正解または不正解）
      await expect(page.getByText(/正解|不正解/)).toBeVisible({ timeout: 5000 })
    } else {
      // 問題がない場合はスキップ
      test.skip()
    }
  })

  test("問題があれば回答後に解説が表示される", async ({ page }) => {
    await page.goto("/grammar/practice")

    const radioButtons = page.getByRole("radio")
    const count = await radioButtons.count()

    if (count > 0) {
      // 最初の選択肢を選択
      await radioButtons.first().click()

      // 回答ボタンをクリック
      await page.getByRole("button", { name: "回答する" }).click()

      // 解説または次の問題ボタンが表示されることを確認
      await expect(
        page.getByText(/正解|不正解/).or(page.getByRole("button", { name: /次/ }))
      ).toBeVisible({ timeout: 5000 })
    } else {
      // 問題がない場合はスキップ
      test.skip()
    }
  })
})

test.describe("復習ページ", () => {
  test("/review にアクセスできる", async ({ page }) => {
    await page.goto("/review")
    await expect(page).toHaveURL(/\/review/)
  })

  test("ページタイトルが表示される", async ({ page }) => {
    await page.goto("/review")
    await expect(page.getByRole("heading", { name: "復習" })).toBeVisible()
  })

  test("統計カードが表示される", async ({ page }) => {
    await page.goto("/review")

    // 統計カードのタイトルを確認（exact matchを使用）
    await expect(page.getByText("ブックマーク", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("要復習", { exact: true })).toBeVisible()
    await expect(page.getByText("完了", { exact: true })).toBeVisible()
  })

  test("今日の復習セクションが表示される", async ({ page }) => {
    await page.goto("/review")
    // "今日の復習"または完了メッセージが表示される
    const hasTodayReview = await page.getByText("今日の復習").first().isVisible().catch(() => false)
    const hasCompletedMessage = await page.getByText("今日の復習はすべて完了").isVisible().catch(() => false)
    expect(hasTodayReview || hasCompletedMessage).toBeTruthy()
  })

  test("「復習スケジュールを自動生成」ボタンが表示される", async ({ page }) => {
    await page.goto("/review")
    await expect(
      page.getByRole("button", { name: /復習スケジュールを自動生成/ })
    ).toBeVisible()
  })

  test("間隔反復学習についての説明が表示される", async ({ page }) => {
    await page.goto("/review")
    await expect(page.getByText("間隔反復学習について")).toBeVisible()
  })

  test("ブックマークセクションが表示される", async ({ page }) => {
    await page.goto("/review")

    // ブックマークがある場合はタブ、ない場合は空メッセージ
    const hasTabs = await page.getByRole("tab", { name: /すべて/ }).isVisible().catch(() => false)
    const hasEmptyMessage = await page.getByText("ブックマークがありません").isVisible().catch(() => false)
    expect(hasTabs || hasEmptyMessage).toBeTruthy()
  })
})

test.describe("ナビゲーション", () => {
  test("ヘッダーに「単語」リンクがある", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "単語" })).toBeVisible()
  })

  test("ヘッダーに「文法」リンクがある", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "文法" })).toBeVisible()
  })

  test("ヘッダーに「復習」リンクがある", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "復習" })).toBeVisible()
  })

  test("「単語」リンクをクリックすると /vocabulary に遷移", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: "単語" }).click({ force: true })
    await expect(page).toHaveURL(/\/vocabulary/)
  })

  test("「文法」リンクをクリックすると /grammar に遷移", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: "文法" }).click({ force: true })
    await expect(page).toHaveURL(/\/grammar/)
  })

  test("「復習」リンクをクリックすると /review に遷移", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: "復習" }).click({ force: true })
    await expect(page).toHaveURL(/\/review/)
  })
})

test.describe("タイマー機能", () => {
  test("文法問題があればタイマーが動作する", async ({ page }) => {
    await page.goto("/grammar/practice")

    const hasTimer = await page.getByText(/0:\d{2}/).isVisible().catch(() => false)

    if (hasTimer) {
      // 3秒待ってタイマーが進むことを確認
      await page.waitForTimeout(3000)
      await expect(page.getByText(/0:0[3-9]|0:1\d/)).toBeVisible()
    } else {
      // 問題がない場合はスキップ
      test.skip()
    }
  })
})

test.describe("ブックマーク機能", () => {
  test("文法問題があればブックマークボタンがある", async ({ page }) => {
    await page.goto("/grammar/practice")

    const radioButtons = page.getByRole("radio")
    const count = await radioButtons.count()

    if (count > 0) {
      // ブックマークアイコン（Bookmark）が存在することを確認
      const bookmarkButton = page
        .locator("button")
        .filter({ has: page.locator("svg") })
        .first()
      await expect(bookmarkButton).toBeVisible()
    } else {
      // 問題がない場合はスキップ
      test.skip()
    }
  })
})

test.describe("ページ間の遷移", () => {
  test("単語学習 → フラッシュカード → 単語学習の往復", async ({ page }) => {
    // 単語学習ページへ
    await page.goto("/vocabulary")
    await expect(page).toHaveURL(/\/vocabulary/)

    // フラッシュカードへ遷移（forceオプションでNext.jsオーバーレイを回避）
    await page.getByRole("link", { name: /学習を開始/ }).click({ force: true })
    await expect(page).toHaveURL(/\/vocabulary\/flashcard/)

    // ブラウザバックで戻る
    await page.goBack()
    await expect(page).toHaveURL(/\/vocabulary/)
  })

  test("文法学習 → 練習 → 文法学習の往復", async ({ page }) => {
    // 文法学習ページへ
    await page.goto("/grammar")
    await expect(page).toHaveURL(/\/grammar/)

    // 練習ページへ遷移（forceオプションでNext.jsオーバーレイを回避）
    await page.getByRole("link", { name: /練習を開始/ }).click({ force: true })
    await expect(page).toHaveURL(/\/grammar\/practice/)

    // ブラウザバックで戻る
    await page.goBack()
    await expect(page).toHaveURL(/\/grammar/)
  })
})
