# Phase 6-A: Stripe決済機能 基盤構築 実装プラン

## 概要

要件定義書 [stripe-billing-requirements.md](stripe-billing-requirements.md) の Phase 6-A に従い、Stripe決済機能の基盤を構築する。

## 実装タスク

### 1. NPMパッケージのインストール

```bash
npm install stripe
```

**注意**: Stripe Checkoutを使用するため、`@stripe/stripe-js` や `@stripe/react-stripe-js` は不要（サーバーサイドのみで完結）

---

### 2. 環境変数の追加

**ファイル**: `.env.local` に追加

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price ID（Stripe Dashboardで作成後に設定）
STRIPE_PRICE_PRO_MONTHLY=price_xxx
```

**ファイル**: `.env.local.example` にも同様のプレースホルダーを追加

---

### 3. DBマイグレーション作成

**ファイル**: `supabase/migrations/009_add_subscriptions.sql`

```sql
-- ============================================
-- 009_add_subscriptions.sql
-- Stripe決済・サブスクリプション管理テーブル
-- ============================================

-- 1. subscriptions（サブスクリプション）
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free', 'pro')),
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 2. invoices（請求履歴）
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount_paid INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  status VARCHAR(30) NOT NULL,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);

-- 3. subscription_logs（変更履歴）
CREATE TABLE subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  previous_plan VARCHAR(20),
  new_plan VARCHAR(20),
  stripe_event_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_logs_user ON subscription_logs(user_id);
CREATE INDEX idx_subscription_logs_event ON subscription_logs(event_type);
CREATE INDEX idx_subscription_logs_created ON subscription_logs(created_at);

-- 4. usage_limits（利用制限追跡）
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  reading_count INTEGER DEFAULT 0,
  grammar_count INTEGER DEFAULT 0,
  vocabulary_count INTEGER DEFAULT 0,
  ai_passage_count INTEGER DEFAULT 0,
  ai_grammar_count INTEGER DEFAULT 0,
  ai_vocabulary_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_usage_limits_user_date ON usage_limits(user_id, usage_date);

-- 5. profilesテーブル拡張
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- subscription_logs
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription logs" ON subscription_logs
  FOR SELECT USING (auth.uid() = user_id);

-- usage_limits
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage limits" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage limits" ON usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage limits" ON usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- updated_at自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### 4. 型定義ファイル作成

**ファイル**: `src/types/subscription.ts`

```typescript
// プランタイプ
export type PlanType = "free" | "pro"

// サブスクリプションステータス
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing"

// サブスクリプション
export interface Subscription {
  id: string
  userId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  planType: PlanType
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

// 請求書
export interface Invoice {
  id: string
  userId: string
  subscriptionId: string
  stripeInvoiceId: string
  amountPaid: number
  currency: string
  status: string
  invoicePdfUrl: string | null
  hostedInvoiceUrl: string | null
  paidAt: string | null
  createdAt: string
}

// 利用制限
export interface UsageLimits {
  readingCount: number
  grammarCount: number
  vocabularyCount: number
  aiPassageCount: number
  aiGrammarCount: number
  aiVocabularyCount: number
}

// プラン別制限
export interface PlanLimits {
  reading: number | null // null = unlimited
  grammar: number | null
  vocabulary: number | null
  bookmarks: number | null
  aiPassageMonthly: number | null
  aiGrammarMonthly: number | null
  aiVocabularyMonthly: number | null
  mockExamMini: boolean
  mockExamFull: boolean
  detailedAnalytics: boolean
  reviewSchedule: boolean
}

// プラン別制限定数
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    reading: 5,
    grammar: 10,
    vocabulary: 20,
    bookmarks: 0,
    aiPassageMonthly: 0,
    aiGrammarMonthly: 0,
    aiVocabularyMonthly: 0,
    mockExamMini: false,
    mockExamFull: false,
    detailedAnalytics: false,
    reviewSchedule: false,
  },
  pro: {
    reading: null, // unlimited
    grammar: null,
    vocabulary: null,
    bookmarks: null,
    aiPassageMonthly: null,
    aiGrammarMonthly: null,
    aiVocabularyMonthly: null,
    mockExamMini: true,
    mockExamFull: true,
    detailedAnalytics: true,
    reviewSchedule: true,
  },
}

// DB型からアプリケーション型への変換ヘルパー
export function toSubscription(row: {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_type: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    planType: row.plan_type as PlanType,
    status: row.status as SubscriptionStatus,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    canceledAt: row.canceled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toInvoice(row: {
  id: string
  user_id: string
  subscription_id: string
  stripe_invoice_id: string
  amount_paid: number
  currency: string
  status: string
  invoice_pdf_url: string | null
  hosted_invoice_url: string | null
  paid_at: string | null
  created_at: string
}): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    subscriptionId: row.subscription_id,
    stripeInvoiceId: row.stripe_invoice_id,
    amountPaid: row.amount_paid,
    currency: row.currency,
    status: row.status,
    invoicePdfUrl: row.invoice_pdf_url,
    hostedInvoiceUrl: row.hosted_invoice_url,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }
}
```

---

### 5. Stripeクライアント設定

**ファイル**: `src/lib/stripe/client.ts`

```typescript
import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})
```

**ファイル**: `src/lib/stripe/prices.ts`

```typescript
// Stripe Price ID マッピング
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY!,
} as const

// 価格表示用（静的）
export const PRICE_DISPLAY = {
  PRO_MONTHLY: {
    amount: 480,
    currency: "jpy",
    interval: "month" as const,
    label: "¥480/月",
  },
} as const
```

---

### 6. キャッシュ設定の更新

**ファイル**: `src/lib/cache.ts` に追加

```typescript
// 既存のCACHE_TAGSに追加
export const CACHE_TAGS = {
  // ... 既存のタグ
  SUBSCRIPTION: "subscription",
  BILLING: "billing",
} as const
```

---

## 作成ファイル一覧

| ファイル | 説明 |
|---------|------|
| `supabase/migrations/009_add_subscriptions.sql` | DBマイグレーション |
| `src/types/subscription.ts` | 型定義 |
| `src/lib/stripe/client.ts` | Stripeクライアント |
| `src/lib/stripe/prices.ts` | Price ID マッピング |

## 修正ファイル一覧

| ファイル | 修正内容 |
|---------|---------|
| `.env.local` | Stripe環境変数追加 |
| `.env.local.example` | Stripeプレースホルダー追加 |
| `src/lib/cache.ts` | CACHE_TAGSにSUBSCRIPTION, BILLING追加 |
| `package.json` | stripeパッケージ追加 |

---

## 検証手順

1. **パッケージインストール確認**
   ```bash
   npm install
   npm run build
   ```

2. **型チェック**
   ```bash
   npx tsc --noEmit
   ```

3. **マイグレーション実行（ローカル）**
   ```bash
   npx supabase db push
   ```

4. **Stripeクライアント動作確認**
   ```typescript
   // 一時的なテストコード
   import { stripe } from "@/lib/stripe/client"
   const products = await stripe.products.list({ limit: 1 })
   console.log("Stripe connected:", products.data.length >= 0)
   ```

---

## 次のフェーズ（Phase 6-B）への準備

Phase 6-A完了後、Phase 6-Bでは以下を実装:
- Server Actions（subscription.ts）
- Webhook endpoint
- 料金プランページ（/pricing）
- 決済成功/キャンセルページ
- サブスクリプション管理画面
