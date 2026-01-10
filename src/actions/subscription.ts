"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { STRIPE_PRICES } from "@/lib/stripe/prices"
import {
  Subscription,
  PlanType,
  toSubscription,
} from "@/types/subscription"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

/**
 * 現在のユーザーのサブスクリプション情報を取得
 */
export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error || !data) return null

  return toSubscription(data)
}

/**
 * 現在のプランタイプを取得（ヘルパー関数）
 */
export async function getPlanType(): Promise<PlanType> {
  const subscription = await getSubscription()

  // サブスクリプションがない、またはアクティブでない場合はfree
  if (!subscription) return "free"
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return "free"
  }

  return subscription.planType
}

/**
 * Stripe Checkout Sessionを作成
 */
export async function createCheckoutSession(): Promise<
  { url: string } | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  try {
    // 既存の Stripe Customer を確認
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Stripe Customer が存在しない場合は作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // profiles テーブルに保存
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // Checkout Session 作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICES.PRO_MONTHLY,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      locale: "ja",
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    if (!session.url) {
      return { error: "Checkout Sessionの作成に失敗しました" }
    }

    return { url: session.url }
  } catch (error) {
    console.error("Create checkout session error:", error)
    return { error: "決済セッションの作成に失敗しました" }
  }
}

/**
 * Stripe Customer Portal Sessionを作成
 */
export async function createPortalSession(): Promise<
  { url: string } | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return { error: "サブスクリプション情報が見つかりません" }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
    })

    return { url: session.url }
  } catch (error) {
    console.error("Create portal session error:", error)
    return { error: "ポータルセッションの作成に失敗しました" }
  }
}

/**
 * サブスクリプションを解約（期間終了時）
 */
export async function cancelSubscription(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "認証が必要です" }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .single()

  if (!subscription?.stripe_subscription_id) {
    return { success: false, error: "サブスクリプションが見つかりません" }
  }

  try {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // DBを更新
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    revalidateTag(CACHE_TAGS.SUBSCRIPTION, "default")

    return { success: true }
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return { success: false, error: "解約処理に失敗しました" }
  }
}

/**
 * 解約をキャンセル（解約予定を取り消し）
 */
export async function reactivateSubscription(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "認証が必要です" }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .single()

  if (!subscription?.stripe_subscription_id) {
    return { success: false, error: "サブスクリプションが見つかりません" }
  }

  try {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    // DBを更新
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
      })
      .eq("user_id", user.id)

    revalidateTag(CACHE_TAGS.SUBSCRIPTION, "default")

    return { success: true }
  } catch (error) {
    console.error("Reactivate subscription error:", error)
    return { success: false, error: "解約キャンセルに失敗しました" }
  }
}
