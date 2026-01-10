import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe/client"
import { createServiceClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session
        )
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(
          supabase,
          event.data.object as Stripe.Subscription
        )
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription
        )
        break

      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          supabase,
          event.data.object as Stripe.Invoice
        )
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

/**
 * Checkout Session完了時の処理
 */
async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    console.error("No supabase_user_id in session metadata")
    return
  }

  // subscriptions テーブルを upsert
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan_type: "pro",
      status: "active",
    },
    {
      onConflict: "user_id",
    }
  )

  if (error) {
    console.error("Error upserting subscription:", error)
    throw error
  }

  // ログを記録
  await supabase.from("subscription_logs").insert({
    user_id: userId,
    event_type: "created",
    new_plan: "pro",
    stripe_event_id: session.id,
  })

  console.log(`Subscription created for user: ${userId}`)
}

/**
 * サブスクリプション更新時の処理
 */
async function handleSubscriptionUpdate(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) {
    // metadataがない場合、stripe_subscription_idで検索
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .single()

    if (!existingSub) {
      console.error(
        "No supabase_user_id in subscription metadata and subscription not found"
      )
      return
    }
  }

  const status = mapStripeStatus(subscription.status)

  // Stripe APIではtimestamp(秒)として返される
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id)

  if (error) {
    console.error("Error updating subscription:", error)
    throw error
  }

  console.log(`Subscription updated: ${subscription.id}`)
}

/**
 * サブスクリプション削除時の処理
 */
async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  // subscription から user_id を取得
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single()

  if (!existingSub) {
    console.error("Subscription not found for deletion")
    return
  }

  // Freeプランに戻す
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan_type: "free",
      status: "canceled",
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscription.id)

  if (error) {
    console.error("Error deleting subscription:", error)
    throw error
  }

  // ログを記録
  await supabase.from("subscription_logs").insert({
    user_id: existingSub.user_id,
    event_type: "canceled",
    previous_plan: "pro",
    new_plan: "free",
    stripe_event_id: subscription.id,
  })

  console.log(`Subscription deleted for user: ${existingSub.user_id}`)
}

/**
 * 請求書支払い完了時の処理
 */
async function handleInvoicePaid(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
) {
  // Stripe APIの型定義に合わせてanyでアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as any
  const subscriptionId =
    typeof inv.subscription === "string"
      ? inv.subscription
      : inv.subscription?.id
  if (!subscriptionId) return

  // subscription から user_id を取得
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single()

  if (!sub) {
    console.error("Subscription not found for invoice")
    return
  }

  // invoices テーブルに記録
  const { error } = await supabase.from("invoices").upsert(
    {
      user_id: sub.user_id,
      subscription_id: sub.id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id:
        typeof inv.payment_intent === "string"
          ? inv.payment_intent
          : inv.payment_intent?.id || null,
      amount_paid: inv.amount_paid || 0,
      currency: invoice.currency,
      status: invoice.status || "paid",
      invoice_pdf_url: inv.invoice_pdf || null,
      hosted_invoice_url: inv.hosted_invoice_url || null,
      paid_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_invoice_id",
    }
  )

  if (error) {
    console.error("Error recording invoice:", error)
    throw error
  }

  console.log(`Invoice paid: ${invoice.id}`)
}

/**
 * 請求書支払い失敗時の処理
 */
async function handleInvoicePaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
) {
  // Stripe APIの型定義に合わせてanyでアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as any
  const subscriptionId =
    typeof inv.subscription === "string"
      ? inv.subscription
      : inv.subscription?.id
  if (!subscriptionId) return

  // subscription から user_id を取得
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single()

  if (!sub) {
    console.error("Subscription not found for failed invoice")
    return
  }

  // ステータスを past_due に更新
  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("id", sub.id)

  // ログを記録
  await supabase.from("subscription_logs").insert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    event_type: "payment_failed",
    stripe_event_id: invoice.id,
    metadata: { amount: inv.amount_due || 0 },
  })

  console.log(`Payment failed for invoice: ${invoice.id}`)
}

/**
 * Stripeのステータスをアプリケーションのステータスに変換
 */
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "incomplete":
    case "incomplete_expired":
      return "incomplete"
    case "trialing":
      return "trialing"
    case "unpaid":
      return "past_due"
    default:
      return "active"
  }
}
