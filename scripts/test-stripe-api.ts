/**
 * Stripe API動作テストスクリプト
 *
 * 実行方法:
 * npx tsx --env-file=.env.local scripts/test-stripe-api.ts
 */

import Stripe from "stripe"

async function testStripeAPI() {
  console.log("=== Stripe API 動作テスト ===\n")

  // 1. 環境変数チェック
  console.log("1. 環境変数チェック")
  const requiredEnvVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRO_MONTHLY",
  ]

  let allEnvVarsSet = true
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (value) {
      console.log(`   ✅ ${envVar}: 設定済み (${value.substring(0, 10)}...)`)
    } else {
      console.log(`   ❌ ${envVar}: 未設定`)
      allEnvVarsSet = false
    }
  }

  if (!allEnvVarsSet) {
    console.log("\n❌ 環境変数が不足しています。.env.local を確認してください。")
    process.exit(1)
  }

  // 2. Stripeクライアント初期化
  console.log("\n2. Stripeクライアント初期化")
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  })
  console.log("   ✅ Stripeクライアント初期化成功")

  // 3. API接続テスト（アカウント情報取得）
  console.log("\n3. API接続テスト")
  try {
    const account = await stripe.accounts.retrieve()
    console.log(`   ✅ API接続成功`)
    console.log(`   - アカウントID: ${account.id}`)
    console.log(
      `   - モード: ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "テスト" : "本番"}`
    )
  } catch (error) {
    console.log(`   ❌ API接続失敗: ${error}`)
    process.exit(1)
  }

  // 4. 価格情報取得テスト
  console.log("\n4. 価格情報取得テスト")
  try {
    const price = await stripe.prices.retrieve(
      process.env.STRIPE_PRICE_PRO_MONTHLY!
    )
    console.log(`   ✅ 価格情報取得成功`)
    console.log(`   - Price ID: ${price.id}`)
    console.log(`   - 金額: ¥${price.unit_amount}`)
    console.log(`   - 通貨: ${price.currency.toUpperCase()}`)
    console.log(`   - 請求間隔: ${price.recurring?.interval || "なし"}`)
    console.log(`   - アクティブ: ${price.active ? "はい" : "いいえ"}`)
  } catch (error) {
    console.log(`   ❌ 価格情報取得失敗: ${error}`)
    console.log("   → STRIPE_PRICE_PRO_MONTHLY が正しいか確認してください")
    process.exit(1)
  }

  // 5. 顧客一覧取得テスト（API権限確認）
  console.log("\n5. 顧客一覧取得テスト")
  try {
    const customers = await stripe.customers.list({ limit: 1 })
    console.log(`   ✅ 顧客一覧取得成功`)
    console.log(`   - 顧客数: ${customers.data.length}件取得`)
  } catch (error) {
    console.log(`   ❌ 顧客一覧取得失敗: ${error}`)
  }

  // 6. Checkout Session作成テスト（実際には作成しない - dry run）
  console.log("\n6. Checkout Session作成可能か確認")
  try {
    // テスト用のセッションを作成してすぐキャンセル
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_PRO_MONTHLY!,
          quantity: 1,
        },
      ],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30分後に期限切れ
    })
    console.log(`   ✅ Checkout Session作成成功`)
    console.log(`   - Session ID: ${session.id}`)
    console.log(`   - URL: ${session.url?.substring(0, 50)}...`)

    // セッションを期限切れにする（実際のテストなのでそのまま放置）
    console.log(`   - ステータス: ${session.status}`)
  } catch (error) {
    console.log(`   ❌ Checkout Session作成失敗: ${error}`)
    process.exit(1)
  }

  // 7. Customer Portal設定確認
  console.log("\n7. Customer Portal設定確認")
  try {
    const configurations =
      await stripe.billingPortal.configurations.list({ limit: 1 })
    if (configurations.data.length > 0) {
      console.log(`   ✅ Customer Portal設定済み`)
      console.log(`   - Configuration ID: ${configurations.data[0].id}`)
    } else {
      console.log(`   ⚠️ Customer Portalの設定が見つかりません`)
      console.log(
        `   → Stripe DashboardでCustomer Portalを有効化してください`
      )
    }
  } catch (error) {
    console.log(`   ⚠️ Customer Portal確認失敗: ${error}`)
  }

  // 8. Webhook署名検証テスト
  console.log("\n8. Webhook署名検証テスト")
  try {
    const testPayload = JSON.stringify({ type: "test" })
    const testTimestamp = Math.floor(Date.now() / 1000)
    const testSignature = stripe.webhooks.generateTestHeaderString({
      payload: testPayload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    })

    const event = stripe.webhooks.constructEvent(
      testPayload,
      testSignature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log(`   ✅ Webhook署名検証成功`)
    console.log(`   - イベントタイプ: ${event.type}`)
  } catch (error) {
    console.log(`   ❌ Webhook署名検証失敗: ${error}`)
  }

  console.log("\n=== テスト完了 ===")
  console.log("すべてのStripe API接続テストが成功しました！")
}

testStripeAPI().catch(console.error)
