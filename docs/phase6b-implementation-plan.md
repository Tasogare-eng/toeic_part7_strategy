# Phase 6-B 実装プラン: サブスクリプション機能

## 概要

Phase 6-Aで構築したStripe決済基盤を活用し、サブスクリプション機能を実装する。

### 実装スコープ

- Server Actions実装（subscription.ts）
- Webhook endpoint実装
- 料金プランページ（/pricing）
- 決済成功/キャンセルページ
- サブスクリプション管理画面（/settings/subscription）

---

## 前提条件（Phase 6-A完了済み）

| 項目 | 状態 |
|------|------|
| Stripe npmパッケージ | ✅ インストール済み |
| DBマイグレーション（009_add_subscriptions.sql） | ✅ 作成済み |
| 型定義（src/types/subscription.ts） | ✅ 作成済み |
| Stripeクライアント（src/lib/stripe/client.ts） | ✅ 作成済み |
| 価格設定（src/lib/stripe/prices.ts） | ✅ 作成済み |
| キャッシュタグ追加 | ✅ 完了 |

---

## 実装タスク

### Task 1: Server Actions実装（src/actions/subscription.ts）

#### 1.1 ファイル作成

```typescript
// src/actions/subscription.ts
"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { STRIPE_PRICES } from "@/lib/stripe/prices"
import {
  Subscription,
  PlanType,
  PLAN_LIMITS,
  toSubscription
} from "@/types/subscription"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"
import { redirect } from "next/navigation"
```

#### 1.2 実装する関数

| 関数 | 説明 | 優先度 |
|------|------|--------|
| `getSubscription()` | 現在のサブスクリプション取得 | 高 |
| `getPlanType()` | 現在のプランタイプ取得（ヘルパー） | 高 |
| `createCheckoutSession()` | Stripe Checkout Session作成 | 高 |
| `createPortalSession()` | Customer Portal Session作成 | 高 |
| `cancelSubscription()` | サブスクリプション解約（期間終了時） | 高 |
| `reactivateSubscription()` | 解約キャンセル | 中 |

#### 1.3 getSubscription() 実装

```typescript
export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error || !data) return null

  return toSubscription(data)
}
```

#### 1.4 getPlanType() 実装

```typescript
export async function getPlanType(): Promise<PlanType> {
  const subscription = await getSubscription()

  // サブスクリプションがない、またはアクティブでない場合はfree
  if (!subscription) return "free"
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return "free"
  }

  return subscription.planType
}
```

#### 1.5 createCheckoutSession() 実装

```typescript
export async function createCheckoutSession(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

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
}
```

#### 1.6 createPortalSession() 実装

```typescript
export async function createPortalSession(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

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
}
```

#### 1.7 cancelSubscription() 実装

```typescript
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

    revalidateTag(CACHE_TAGS.SUBSCRIPTION)

    return { success: true }
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return { success: false, error: "解約処理に失敗しました" }
  }
}
```

#### 1.8 reactivateSubscription() 実装

```typescript
export async function reactivateSubscription(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

    revalidateTag(CACHE_TAGS.SUBSCRIPTION)

    return { success: true }
  } catch (error) {
    console.error("Reactivate subscription error:", error)
    return { success: false, error: "解約キャンセルに失敗しました" }
  }
}
```

---

### Task 2: Webhook Endpoint実装

#### 2.1 ファイル構成

```
src/app/api/webhooks/stripe/
└── route.ts
```

#### 2.2 route.ts 実装

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe/client"
import { createServiceClient } from "@/lib/supabase/server"

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
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice)
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
```

#### 2.3 Webhook ハンドラー関数

```typescript
// handleCheckoutCompleted
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    console.error("No supabase_user_id in session metadata")
    return
  }

  // subscriptions テーブルを upsert
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan_type: "pro",
      status: "active",
    }, {
      onConflict: "user_id"
    })

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
}

// handleSubscriptionUpdate
async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) {
    console.error("No supabase_user_id in subscription metadata")
    return
  }

  const status = mapStripeStatus(subscription.status)

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id)

  if (error) {
    console.error("Error updating subscription:", error)
    throw error
  }
}

// handleSubscriptionDeleted
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) {
    console.error("No supabase_user_id in subscription metadata")
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
    user_id: userId,
    event_type: "canceled",
    previous_plan: "pro",
    new_plan: "free",
    stripe_event_id: subscription.id,
  })
}

// handleInvoicePaid
async function handleInvoicePaid(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string
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
  await supabase.from("invoices").upsert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status || "paid",
    invoice_pdf_url: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    paid_at: new Date().toISOString(),
  }, {
    onConflict: "stripe_invoice_id"
  })
}

// handleInvoicePaymentFailed
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string
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
    metadata: { amount: invoice.amount_due },
  })
}

// ヘルパー関数
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
```

---

### Task 3: 料金プランページ（/pricing）

#### 3.1 ファイル構成

```
src/app/(main)/pricing/
└── page.tsx
```

#### 3.2 UIコンポーネント作成

```
src/components/subscription/
├── PricingCard.tsx        # 料金プランカード
├── PlanFeatureList.tsx    # 機能一覧
└── UpgradeButton.tsx      # アップグレードボタン
```

#### 3.3 PricingCard.tsx

```typescript
// src/components/subscription/PricingCard.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { PlanType } from "@/types/subscription"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  plan: "free" | "pro"
  currentPlan: PlanType
  price: string
  features: { name: string; included: boolean }[]
  onUpgrade?: () => void
  loading?: boolean
}

export function PricingCard({
  plan,
  currentPlan,
  price,
  features,
  onUpgrade,
  loading,
}: PricingCardProps) {
  const isPro = plan === "pro"
  const isCurrentPlan = currentPlan === plan

  return (
    <Card className={cn(
      "relative flex flex-col",
      isPro && "border-primary shadow-lg"
    )}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            おすすめ
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-xl">
          {isPro ? "Pro プラン" : "Free プラン"}
        </CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{price}</span>
          {isPro && <span className="text-muted-foreground">/月</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature.name} className="flex items-center gap-2">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm",
                !feature.included && "text-muted-foreground"
              )}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button className="w-full" variant="outline" disabled>
            現在のプラン
          </Button>
        ) : isPro ? (
          <Button
            className="w-full"
            onClick={onUpgrade}
            disabled={loading}
          >
            {loading ? "処理中..." : "Pro にアップグレード"}
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            無料で始める
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

#### 3.4 pricing/page.tsx

```typescript
// src/app/(main)/pricing/page.tsx
import { Metadata } from "next"
import { getSubscription } from "@/actions/subscription"
import { PricingSection } from "@/components/subscription/PricingSection"

export const metadata: Metadata = {
  title: "料金プラン | TOEIC Part7 トレーニング",
  description: "TOEIC Part7 トレーニングの料金プラン",
}

export default async function PricingPage() {
  const subscription = await getSubscription()
  const currentPlan = subscription?.planType ?? "free"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">シンプルな料金プラン</h1>
        <p className="text-muted-foreground">
          あなたの学習スタイルに合わせてお選びください
        </p>
      </div>

      <PricingSection currentPlan={currentPlan} />

      <div className="mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">よくある質問</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">いつでも解約できますか？</h3>
            <p className="text-sm text-muted-foreground">
              はい、いつでも解約可能です。解約しても、次回請求日まではProプランの機能をご利用いただけます。
            </p>
          </div>
          <div>
            <h3 className="font-medium">支払い方法は？</h3>
            <p className="text-sm text-muted-foreground">
              クレジットカード・デビットカードに対応しています。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 4: 決済成功/キャンセルページ

#### 4.1 ファイル構成

```
src/app/(main)/payment/
├── success/
│   └── page.tsx
└── cancel/
    └── page.tsx
```

#### 4.2 success/page.tsx

```typescript
// src/app/(main)/payment/success/page.tsx
import { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "決済完了 | TOEIC Part7 トレーニング",
}

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">お支払いが完了しました</CardTitle>
          <CardDescription>
            Pro プランへのご加入ありがとうございます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            すべての機能がご利用いただけるようになりました。
            さっそく学習を始めましょう。
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/subscription">サブスクリプション管理</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 4.3 cancel/page.tsx

```typescript
// src/app/(main)/payment/cancel/page.tsx
import { Metadata } from "next"
import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "決済キャンセル | TOEIC Part7 トレーニング",
}

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">決済がキャンセルされました</CardTitle>
          <CardDescription>
            お支払いは完了していません
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            決済を完了するには、もう一度お試しください。
            ご不明な点がございましたらお問い合わせください。
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/pricing">料金プランに戻る</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Task 5: サブスクリプション管理画面（/settings/subscription）

#### 5.1 ファイル構成

```
src/app/(main)/settings/
├── page.tsx                    # 設定トップ
├── layout.tsx                  # 設定レイアウト
└── subscription/
    └── page.tsx                # サブスクリプション管理
```

#### 5.2 settings/layout.tsx

```typescript
// src/app/(main)/settings/layout.tsx
import { ReactNode } from "react"
import Link from "next/link"
import { CreditCard, Settings } from "lucide-react"

const settingsNav = [
  { href: "/settings/subscription", label: "サブスクリプション", icon: CreditCard },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            設定
          </h2>
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
```

#### 5.3 settings/page.tsx

```typescript
// src/app/(main)/settings/page.tsx
import { redirect } from "next/navigation"

export default function SettingsPage() {
  redirect("/settings/subscription")
}
```

#### 5.4 settings/subscription/page.tsx

```typescript
// src/app/(main)/settings/subscription/page.tsx
import { Metadata } from "next"
import { getSubscription } from "@/actions/subscription"
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { ManageSubscription } from "@/components/subscription/ManageSubscription"

export const metadata: Metadata = {
  title: "サブスクリプション管理 | TOEIC Part7 トレーニング",
}

export default async function SubscriptionPage() {
  const subscription = await getSubscription()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">サブスクリプション管理</h1>
        <p className="text-muted-foreground">
          プランの確認・変更・解約ができます
        </p>
      </div>

      <SubscriptionStatus subscription={subscription} />

      <ManageSubscription subscription={subscription} />
    </div>
  )
}
```

#### 5.5 SubscriptionStatus.tsx

```typescript
// src/components/subscription/SubscriptionStatus.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Subscription } from "@/types/subscription"
import { PRICE_DISPLAY } from "@/lib/stripe/prices"

interface SubscriptionStatusProps {
  subscription: Subscription | null
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const isPro = subscription?.planType === "pro" && subscription?.status === "active"

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          現在のプラン
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? "Pro" : "Free"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isPro
            ? `${PRICE_DISPLAY.PRO_MONTHLY.label}`
            : "無料プラン"}
        </CardDescription>
      </CardHeader>
      {isPro && subscription && (
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">次回請求日</dt>
              <dd>{formatDate(subscription.currentPeriodEnd)}</dd>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="flex justify-between text-orange-600">
                <dt>解約予定</dt>
                <dd>{formatDate(subscription.currentPeriodEnd)}に終了</dd>
              </div>
            )}
          </dl>
        </CardContent>
      )}
    </Card>
  )
}
```

#### 5.6 ManageSubscription.tsx

```typescript
// src/components/subscription/ManageSubscription.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Subscription } from "@/types/subscription"
import {
  createPortalSession,
  cancelSubscription,
  reactivateSubscription,
  createCheckoutSession,
} from "@/actions/subscription"
import { ExternalLink } from "lucide-react"

interface ManageSubscriptionProps {
  subscription: Subscription | null
}

export function ManageSubscription({ subscription }: ManageSubscriptionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isPro = subscription?.planType === "pro" && subscription?.status === "active"
  const isCanceling = subscription?.cancelAtPeriodEnd

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const result = await createCheckoutSession()
      if ("url" in result) {
        window.location.href = result.url
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManagePayment = async () => {
    setLoading(true)
    try {
      const result = await createPortalSession()
      if ("url" in result) {
        window.location.href = result.url
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      const result = await cancelSubscription()
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setLoading(true)
    try {
      const result = await reactivateSubscription()
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pro プランにアップグレード</CardTitle>
          <CardDescription>
            全機能を解放して、効率的に学習を進めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading ? "処理中..." : "Pro プランに加入"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 支払い方法管理 */}
      <Card>
        <CardHeader>
          <CardTitle>お支払い方法</CardTitle>
          <CardDescription>
            Stripeで支払い方法を管理できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleManagePayment} disabled={loading}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Stripeで管理
          </Button>
        </CardContent>
      </Card>

      {/* 解約管理 */}
      <Card>
        <CardHeader>
          <CardTitle>サブスクリプションの解約</CardTitle>
          <CardDescription>
            {isCanceling
              ? "解約予定です。期間終了後に無料プランに移行します。"
              : "解約すると、次回請求日まではProプランをご利用いただけます。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCanceling ? (
            <Button variant="outline" onClick={handleReactivate} disabled={loading}>
              {loading ? "処理中..." : "解約をキャンセル"}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">解約する</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に解約しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    解約すると、次回請求日以降はProプランの機能が利用できなくなります。
                    解約は次回請求日まで取り消すことができます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={loading}>
                    {loading ? "処理中..." : "解約する"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Task 6: ミドルウェア更新

#### 6.1 保護パスの追加

```typescript
// src/middleware.ts に追加
const protectedPaths = [
  '/dashboard', '/reading', '/vocabulary', '/grammar', '/review',
  '/results', '/admin', '/analytics', '/mock-exam',
  '/settings',   // 追加
  '/pricing',    // 追加
  '/payment',    // 追加
]
```

---

### Task 7: PricingSection コンポーネント

```typescript
// src/components/subscription/PricingSection.tsx
"use client"

import { useState } from "react"
import { PricingCard } from "./PricingCard"
import { PlanType } from "@/types/subscription"
import { createCheckoutSession } from "@/actions/subscription"

const FREE_FEATURES = [
  { name: "長文読解 5問/日", included: true },
  { name: "文法学習 10問/日", included: true },
  { name: "単語学習 20語/日", included: true },
  { name: "基本ダッシュボード", included: true },
  { name: "模試機能", included: false },
  { name: "詳細分析", included: false },
  { name: "復習スケジュール", included: false },
  { name: "AI問題生成", included: false },
]

const PRO_FEATURES = [
  { name: "長文読解 無制限", included: true },
  { name: "文法学習 無制限", included: true },
  { name: "単語学習 無制限", included: true },
  { name: "基本ダッシュボード", included: true },
  { name: "模試機能", included: true },
  { name: "詳細分析", included: true },
  { name: "復習スケジュール", included: true },
  { name: "AI問題生成", included: true },
]

interface PricingSectionProps {
  currentPlan: PlanType
}

export function PricingSection({ currentPlan }: PricingSectionProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const result = await createCheckoutSession()
      if ("url" in result) {
        window.location.href = result.url
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <PricingCard
        plan="free"
        currentPlan={currentPlan}
        price="¥0"
        features={FREE_FEATURES}
      />
      <PricingCard
        plan="pro"
        currentPlan={currentPlan}
        price="¥480"
        features={PRO_FEATURES}
        onUpgrade={handleUpgrade}
        loading={loading}
      />
    </div>
  )
}
```

---

## ファイル一覧

### 新規作成ファイル

| ファイル | 説明 |
|---------|------|
| `src/actions/subscription.ts` | サブスクリプションServer Actions |
| `src/app/api/webhooks/stripe/route.ts` | Stripe Webhook endpoint |
| `src/app/(main)/pricing/page.tsx` | 料金プランページ |
| `src/app/(main)/payment/success/page.tsx` | 決済成功ページ |
| `src/app/(main)/payment/cancel/page.tsx` | 決済キャンセルページ |
| `src/app/(main)/settings/layout.tsx` | 設定レイアウト |
| `src/app/(main)/settings/page.tsx` | 設定トップ（リダイレクト） |
| `src/app/(main)/settings/subscription/page.tsx` | サブスクリプション管理 |
| `src/components/subscription/PricingCard.tsx` | 料金プランカード |
| `src/components/subscription/PricingSection.tsx` | 料金プランセクション |
| `src/components/subscription/SubscriptionStatus.tsx` | サブスクリプション状態表示 |
| `src/components/subscription/ManageSubscription.tsx` | サブスクリプション管理UI |

### 更新ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/middleware.ts` | 保護パス追加（/settings, /pricing, /payment） |

---

## 実装順序

1. **Server Actions**（src/actions/subscription.ts）
2. **Webhook endpoint**（src/app/api/webhooks/stripe/route.ts）
3. **UIコンポーネント**
   - PricingCard.tsx
   - PricingSection.tsx
   - SubscriptionStatus.tsx
   - ManageSubscription.tsx
4. **ページ実装**
   - /pricing
   - /payment/success
   - /payment/cancel
   - /settings/layout.tsx
   - /settings/page.tsx
   - /settings/subscription
5. **ミドルウェア更新**
6. **動作確認・テスト**

---

## テスト計画

### 手動テスト項目

| テスト | 手順 |
|--------|------|
| Checkout Session作成 | /pricingからProプラン購入ボタンをクリック |
| Stripe Checkout | テストカード（4242...）で決済完了 |
| 決済成功リダイレクト | /payment/successへリダイレクト確認 |
| Webhook処理 | subscriptionsテーブルにレコード作成確認 |
| サブスクリプション表示 | /settings/subscriptionでPro表示確認 |
| Customer Portal | 「Stripeで管理」ボタンでPortal表示確認 |
| 解約フロー | 解約ボタン → cancel_at_period_end = true 確認 |
| 解約キャンセル | 解約キャンセルボタン → cancel_at_period_end = false 確認 |

### Stripe CLI テスト

```bash
# Webhook転送
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# イベントトリガー
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.paid
```

---

## 環境変数確認

```env
# 必須（.env.local）
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 注意事項

1. **Webhook署名検証**: 必ず`stripe.webhooks.constructEvent()`で署名検証
2. **エラーハンドリング**: Stripeエラーは適切にキャッチしてログ出力
3. **べき等性**: Webhookハンドラーはべき等に実装（重複イベント対応）
4. **metadata**: user_idをCheckout SessionとSubscriptionのmetadataに設定
5. **テストモード**: 開発中はStripeテストモードを使用
