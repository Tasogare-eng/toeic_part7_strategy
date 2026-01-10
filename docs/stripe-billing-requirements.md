# Stripe決済機能 要件定義書

## 1. 概要

### 1.1 目的
TOEIC Part7トレーニングWebサービスにサブスクリプション型課金機能を導入し、フリーミアムモデルによる収益化を実現する。

### 1.2 対象ユーザー
- **無料ユーザー（Free）**: 基本機能のみ利用可能（日次制限あり）
- **有料ユーザー（Pro）**: 全機能解放

### 1.3 技術スタック
| 項目 | 技術 |
|------|------|
| 決済プロバイダー | Stripe |
| 通貨 | 日本円（JPY）のみ |
| サブスクリプション管理 | Stripe Billing |
| 決済UI | Stripe Checkout（ホスト型） |
| 顧客ポータル | Stripe Customer Portal |
| Webhook | Stripe Webhooks |

---

## 2. 料金プラン定義

### 2.1 プラン一覧

| プラン | 月額料金 | 説明 |
|--------|----------|------|
| **Free** | 0円 | 基本機能のみ（日次制限あり） |
| **Pro** | 480円 | 全機能解放 |

### 2.2 各プランで利用可能な機能

| 機能 | Free | Pro |
|------|:----:|:---:|
| **基本学習機能** | | |
| 長文読解（Part7） | 5問/日 | 無制限 |
| 文法学習（Part5/6） | 10問/日 | 無制限 |
| 単語学習 | 20語/日 | 無制限 |
| 基本ダッシュボード | ○ | ○ |
| **模試機能** | | |
| ミニ模試（15分/30分） | ✗ | ○ |
| フル模試（75分/100問） | ✗ | ○ |
| **分析機能** | | |
| 弱点分析 | ✗ | ○ |
| カテゴリ別統計 | ✗ | ○ |
| 日別推移グラフ | ✗ | ○ |
| **復習機能** | | |
| ブックマーク | ✗ | 無制限 |
| 復習スケジュール | ✗ | ○ |
| 間隔反復学習 | ✗ | ○ |
| **AI機能** | | |
| AI長文生成 | ✗ | 無制限 |
| AI文法問題生成 | ✗ | 無制限 |
| AI単語生成 | ✗ | 無制限 |

---

## 3. 決済フロー

### 3.1 サブスクリプション加入フロー

```
[ユーザー] --> [料金プランページ (/pricing)]
                    |
                    v
            [プラン・期間選択]
                    |
                    v
            [Stripe Checkout Session作成]
            (Server Action: createCheckoutSession)
                    |
                    v
            [Stripe Checkout画面]
            (Stripeがホスト、日本語対応)
                    |
         +----------+-----------+
         |                      |
         v                      v
   [決済成功]              [キャンセル]
         |                      |
         v                      v
   [/payment/success]     [/payment/cancel]
         |
         v
   [Webhook: checkout.session.completed]
         |
         v
   [DBサブスクリプション作成・更新]
```

### 3.2 解約フロー

```
[解約リクエスト] --> [cancel_at_period_end = true]
                           |
                           v
                    [現在の期間終了まで継続利用可能]
                           |
                           v
                    [期間終了時: Freeプランに移行]
```

- 即時解約ではなく、期間終了時に解約（cancel_at_period_end）
- 解約予定状態の表示
- 解約取り消し機能あり

### 3.3 支払い失敗対応

| フェーズ | 対応 |
|---------|------|
| 初回失敗 | Stripeが自動リトライ（3回まで） |
| リトライ期間 | 支払い失敗通知メール送信 |
| 猶予期間 | 7日間（サービス継続利用可能） |
| 猶予期間終了 | Freeプランにダウングレード |

---

## 4. Webhook処理

### 4.1 対応イベント一覧

| イベント | 処理内容 |
|----------|----------|
| `checkout.session.completed` | サブスクリプション作成、DBに反映 |
| `customer.subscription.created` | サブスクリプション情報保存 |
| `customer.subscription.updated` | プラン変更、ステータス変更を反映 |
| `customer.subscription.deleted` | サブスクリプション終了処理（Freeに移行） |
| `invoice.paid` | 支払い成功を記録、請求履歴保存 |
| `invoice.payment_failed` | 支払い失敗を記録、通知処理 |
| `customer.updated` | 顧客情報更新（将来拡張用） |

### 4.2 Webhook セキュリティ

```typescript
// 署名検証必須
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

---

## 5. データベース設計

### 5.1 新規テーブル

#### 5.1.1 subscriptions（サブスクリプション）

```sql
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

-- インデックス
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### 5.1.2 invoices（請求履歴）

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount_paid INTEGER NOT NULL, -- 日本円（整数）
  currency VARCHAR(3) DEFAULT 'jpy',
  status VARCHAR(30) NOT NULL,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);
```

#### 5.1.3 subscription_logs（変更履歴）

```sql
CREATE TABLE subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
    -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'payment_failed'
  previous_plan VARCHAR(20),
  new_plan VARCHAR(20),
  stripe_event_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_subscription_logs_user ON subscription_logs(user_id);
CREATE INDEX idx_subscription_logs_event ON subscription_logs(event_type);
CREATE INDEX idx_subscription_logs_created ON subscription_logs(created_at);
```

#### 5.1.4 usage_limits（利用制限追跡）

```sql
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  -- 日次カウント
  reading_count INTEGER DEFAULT 0,
  grammar_count INTEGER DEFAULT 0,
  vocabulary_count INTEGER DEFAULT 0,
  -- 月次カウント（AI生成）
  ai_passage_count INTEGER DEFAULT 0,
  ai_grammar_count INTEGER DEFAULT 0,
  ai_vocabulary_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- インデックス
CREATE INDEX idx_usage_limits_user_date ON usage_limits(user_id, usage_date);
```

### 5.2 profilesテーブル拡張

```sql
-- profilesテーブルに追加するカラム
ALTER TABLE profiles ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
```

### 5.3 RLSポリシー

```sql
-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Webhook処理はService Role Keyで行うため、別途ポリシー不要

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
```

---

## 6. 画面設計

### 6.1 新規画面一覧

| 画面 | パス | 説明 |
|------|------|------|
| 料金プランページ | `/pricing` | プラン比較・選択画面 |
| 決済成功ページ | `/payment/success` | Checkout完了後のリダイレクト先 |
| 決済キャンセルページ | `/payment/cancel` | Checkoutキャンセル時のリダイレクト先 |
| 設定トップ | `/settings` | 設定メニュー |
| サブスクリプション管理 | `/settings/subscription` | プラン確認・変更・解約 |
| 請求履歴 | `/settings/billing` | 請求履歴一覧・領収書ダウンロード |

### 6.2 料金プランページ（/pricing）

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] TOEIC Part7 Training                    [ログイン]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│             シンプルな料金プラン                                  │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │        Free         │  │     Pro プラン       │              │
│  │                     │  │     ★おすすめ       │              │
│  │        ¥0          │  │     ¥480/月        │              │
│  ├─────────────────────┤  ├─────────────────────┤              │
│  │ ✓ 長文5問/日        │  │ ✓ 全機能解放        │              │
│  │ ✓ 文法10問/日       │  │ ✓ 無制限学習        │              │
│  │ ✓ 単語20語/日       │  │ ✓ 模試機能          │              │
│  │ ✓ 基本ダッシュボード │  │ ✓ 詳細分析          │              │
│  │                     │  │ ✓ 復習機能          │              │
│  │                     │  │ ✓ AI問題生成        │              │
│  ├─────────────────────┤  ├─────────────────────┤              │
│  │   [現在のプラン]     │  │   [Proに加入]       │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                 │
│  よくある質問                                                    │
│  ├ いつでも解約できますか？ → はい、次回請求日まで継続            │
│  └ 支払い方法は？ → クレジットカード・デビットカード              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 サブスクリプション管理画面（/settings/subscription）

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] サブスクリプション管理                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  現在のプラン                                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Pro プラン                                          │       │
│  │  ¥480/月                                            │       │
│  │  次回請求日: 2026年2月10日                           │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  お支払い方法                                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  💳 **** **** **** 4242  VISA                       │       │
│  │  有効期限: 12/2028                                   │       │
│  │  [Stripeで管理]  ← Customer Portalへ遷移             │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  サブスクリプションの解約                                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  解約すると2026年2月10日までプランをご利用いただけます │       │
│  │  その後は無料プランに移行します。                     │       │
│  │  [解約手続きへ]                                      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 既存画面の修正

| 画面 | 修正内容 |
|------|----------|
| ダッシュボード | 現在のプラン表示、アップグレード誘導バナー |
| 模試選択画面 | プラン制限表示、ロック表示、アップグレード導線 |
| 分析画面 | Pro限定コンテンツのロック表示 |
| 復習画面 | ブックマーク上限表示、制限到達時の誘導 |
| AI生成画面 | 月間利用回数表示、制限到達時の誘導 |
| サイドバー | 設定メニューへのリンク追加 |

---

## 7. API設計

### 7.1 Server Actions

#### 7.1.1 サブスクリプション関連（src/actions/subscription.ts）

```typescript
"use server"

// サブスクリプション情報取得
export async function getSubscription(): Promise<Subscription | null>

// プラン情報取得（制限含む）
export async function getPlanLimits(): Promise<PlanLimits>

// Stripe Checkout Session作成
export async function createCheckoutSession(): Promise<{ url: string } | { error: string }>

// Stripe Customer Portal Session作成
export async function createPortalSession(): Promise<{ url: string } | { error: string }>

// サブスクリプション解約（期間終了時）
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }>

// 解約キャンセル（解約予定を取り消し）
export async function reactivateSubscription(): Promise<{ success: boolean; error?: string }>
```

#### 7.1.2 利用制限関連（src/actions/usage.ts）

```typescript
"use server"

// 今日の利用状況取得
export async function getTodayUsage(): Promise<UsageLimits>

// 利用回数をインクリメント（制限チェック付き）
export async function incrementUsage(
  usageType: 'reading' | 'grammar' | 'vocabulary' | 'ai_passage' | 'ai_grammar' | 'ai_vocabulary'
): Promise<{ allowed: boolean; remaining: number }>

// 機能利用可否チェック
export async function canUseFeature(
  feature: 'mock_exam_mini' | 'mock_exam_full' | 'detailed_analytics' | 'review_schedule' | 'ai_generation'
): Promise<{ allowed: boolean; reason?: string }>

// 月間AI利用状況取得
export async function getMonthlyAIUsage(): Promise<{
  passage: { used: number; limit: number }
  grammar: { used: number; limit: number }
  vocabulary: { used: number; limit: number }
}>
```

#### 7.1.3 請求関連（src/actions/billing.ts）

```typescript
"use server"

// 請求履歴取得
export async function getInvoices(limit?: number): Promise<Invoice[]>

// 領収書URL取得
export async function getInvoiceUrl(invoiceId: string): Promise<{ url: string } | { error: string }>
```

### 7.2 Webhook Endpoint（src/app/api/webhooks/stripe/route.ts）

```typescript
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

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
        await handleCheckoutCompleted(supabase, event.data.object)
        break
      case "customer.subscription.created":
        await handleSubscriptionCreated(supabase, event.data.object)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object)
        break
      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object)
        break
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object)
        break
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

---

## 8. 型定義（src/types/subscription.ts）

```typescript
// プランタイプ
export type PlanType = 'free' | 'pro'

// サブスクリプションステータス
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'

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
  reading: number | null      // null = unlimited
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
    reading: null,  // unlimited
    grammar: null,
    vocabulary: null,
    bookmarks: null,  // unlimited
    aiPassageMonthly: null,  // unlimited
    aiGrammarMonthly: null,
    aiVocabularyMonthly: null,
    mockExamMini: true,
    mockExamFull: true,
    detailedAnalytics: true,
    reviewSchedule: true,
  },
}
```

---

## 9. 環境変数

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxx        # 本番用（または sk_test_xxx テスト用）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # 本番用（または pk_test_xxx テスト用）

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price ID（Stripe Dashboardで作成後に設定）
STRIPE_PRICE_PRO_MONTHLY=price_xxx
```

---

## 10. Stripe Dashboard設定

### 10.1 商品（Products）作成

| 商品名 | 価格 | 請求間隔 | Price ID |
|--------|------|----------|----------|
| Pro Monthly | ¥480 | 月次 | price_xxx |

### 10.2 Customer Portal設定

- 有効化
- 解約許可
- 請求履歴表示
- 支払い方法更新許可

### 10.3 Webhook Endpoints設定

- **URL**: `https://yourdomain.com/api/webhooks/stripe`
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

### 10.4 Checkout設定

- **成功URL**: `https://yourdomain.com/payment/success?session_id={CHECKOUT_SESSION_ID}`
- **キャンセルURL**: `https://yourdomain.com/payment/cancel`
- **ロケール**: `ja`（日本語）

---

## 11. 実装フェーズ

### Phase 6-A: 基盤構築
- [ ] Stripeアカウント設定、商品・価格作成
- [ ] 環境変数設定
- [ ] `stripe` npmパッケージインストール
- [ ] DBマイグレーション作成（009_add_subscriptions.sql）
- [ ] 型定義ファイル作成（src/types/subscription.ts）
- [ ] Stripeクライアント設定（src/lib/stripe/client.ts）

### Phase 6-B: サブスクリプション機能
- [ ] Server Actions実装（subscription.ts）
- [ ] Webhook endpoint実装
- [ ] 料金プランページ（/pricing）
- [ ] 決済成功/キャンセルページ
- [ ] サブスクリプション管理画面（/settings/subscription）

### Phase 6-C: 利用制限機能
- [ ] Server Actions実装（usage.ts）
- [ ] 既存Server Actions修正
  - reading.ts: 日次制限チェック追加
  - grammar.ts: 日次制限チェック追加
  - vocabulary.ts: 日次制限チェック追加
  - mock-exam.ts: プラン制限チェック追加
  - analytics.ts: プラン制限チェック追加
  - review.ts: ブックマーク数制限チェック追加
  - ai/generate-*.ts: 月次制限チェック追加
- [ ] 既存画面への制限表示・アップグレード誘導UI追加

### Phase 6-D: 請求・管理機能
- [ ] Server Actions実装（billing.ts）
- [ ] 請求履歴画面（/settings/billing）
- [ ] Customer Portal連携
- [ ] ダッシュボードへのプラン表示追加
- [ ] 設定画面作成（/settings）

### Phase 6-E: テスト・ドキュメント
- [ ] Stripeテストモードでの動作確認
- [ ] Webhook動作テスト（Stripe CLI使用）
- [ ] 各プランでの機能制限テスト
- [ ] E2Eテスト作成（決済フローは手動テスト）
- [ ] CLAUDE.md更新
- [ ] 本番環境デプロイ準備

---

## 12. ディレクトリ構成（追加分）

```
src/
├── app/
│   ├── (main)/
│   │   ├── pricing/
│   │   │   └── page.tsx           # 料金プランページ
│   │   ├── settings/
│   │   │   ├── page.tsx           # 設定トップ
│   │   │   ├── subscription/
│   │   │   │   └── page.tsx       # サブスクリプション管理
│   │   │   └── billing/
│   │   │       └── page.tsx       # 請求履歴
│   │   └── payment/
│   │       ├── success/
│   │       │   └── page.tsx       # 決済成功
│   │       └── cancel/
│   │           └── page.tsx       # 決済キャンセル
│   └── api/
│       └── webhooks/
│           └── stripe/
│               └── route.ts       # Webhook endpoint
├── components/
│   ├── subscription/
│   │   ├── PricingCard.tsx        # プランカード
│   │   ├── PlanComparison.tsx     # プラン比較表
│   │   ├── CurrentPlanBadge.tsx   # 現在のプランバッジ
│   │   ├── UpgradeBanner.tsx      # アップグレード誘導バナー
│   │   └── UsageMeter.tsx         # 利用状況メーター
│   ├── billing/
│   │   ├── InvoiceList.tsx        # 請求履歴リスト
│   │   └── PaymentMethodCard.tsx  # 支払い方法表示
│   └── settings/
│       └── SettingsSidebar.tsx    # 設定サイドバー
├── lib/
│   └── stripe/
│       ├── client.ts              # Stripeクライアント
│       ├── prices.ts              # Price ID マッピング
│       └── webhooks.ts            # Webhook ハンドラー
├── actions/
│   ├── subscription.ts            # サブスクリプション操作
│   ├── usage.ts                   # 利用制限管理
│   └── billing.ts                 # 請求関連
├── types/
│   └── subscription.ts            # 型定義
└── supabase/
    └── migrations/
        └── 009_add_subscriptions.sql  # DBマイグレーション
```

---

## 13. セキュリティ要件

| 要件 | 詳細 |
|------|------|
| **Webhook署名検証** | `stripe.webhooks.constructEvent()` による署名検証必須 |
| **PCI DSS準拠** | Stripe Checkout使用によりPCI DSSスコープ外 |
| **APIキー管理** | Secret Keyはサーバーサイドのみ、環境変数で管理 |
| **HTTPS必須** | 全決済関連通信はHTTPSのみ |
| **RLS適用** | subscriptions, invoices等全テーブルにRLS有効化 |
| **Service Role Key** | Webhook処理でのみ使用、userIdを明示的に指定 |

---

## 14. 非機能要件

### 14.1 パフォーマンス

| 要件 | 目標値 |
|------|--------|
| プラン確認レスポンス | < 100ms（キャッシュ利用） |
| Webhook処理 | < 5秒 |
| Checkout遷移 | < 3秒 |

### 14.2 可用性

| 要件 | 詳細 |
|------|------|
| Stripe障害対応 | Webhookリトライ機構（Stripe側が自動リトライ） |
| ローカルキャッシュ | プラン情報をユーザーセッションにキャッシュ |
| グレースフルデグレーション | Stripe障害時も既存機能は利用可能 |

---

## 15. 注意事項・法的要件

### 15.1 特定商取引法対応
- 特定商取引法に基づく表記ページの作成必須
- 販売者情報、返金ポリシー等の明記

### 15.2 利用規約・プライバシーポリシー
- 有料サービス提供に伴う利用規約の更新
- 決済情報の取り扱いに関するプライバシーポリシー更新

### 15.3 税金対応
- 日本国内向けサービスのため消費税込み価格表示
- Stripe Tax使用は将来検討（現状は税込価格で設定）

### 15.4 既存ユーザー対応
- 既存ユーザーは自動的にFreeプランとして認識
- subscriptionsテーブルにレコードがない場合はFree扱い

---

## 16. 参考リンク

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Billing](https://stripe.com/docs/billing)
- [Stripe Customer Portal](https://stripe.com/docs/customer-management/portal-configuration)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Next.js + Stripe](https://github.com/vercel/nextjs-subscription-payments)
