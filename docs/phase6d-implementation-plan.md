# Phase 6-D 実装プラン - 請求・管理機能

## 概要

Phase 6-Dでは、請求履歴の表示、Customer Portal連携の強化、ダッシュボードへのプラン表示追加、設定画面の改善を実装する。

### 実装目標
- ユーザーが過去の請求履歴を確認できる
- Stripe Customer Portalへのスムーズな導線
- ダッシュボードでのプラン状態の視認性向上
- 設定画面のナビゲーション改善

---

## 1. Server Actions実装（billing.ts）

### 1.1 新規ファイル作成

**ファイル**: `src/actions/billing.ts`

```typescript
"use server"

// 請求履歴取得
export async function getInvoices(limit?: number): Promise<Invoice[]>

// 領収書URL取得（Stripeから直接取得）
export async function getInvoiceUrl(invoiceId: string): Promise<{ url: string } | { error: string }>
```

### 1.2 実装詳細

#### getInvoices
- DBの`invoices`テーブルから取得
- デフォルトで最新12件を取得
- 支払い日降順でソート
- 必要なフィールド: 金額、日付、ステータス、PDF URL

#### getInvoiceUrl
- Stripe APIから最新のhosted_invoice_urlを取得
- セキュリティ上、サーバーサイドでURL生成

---

## 2. 請求履歴画面（/settings/billing）

### 2.1 ページ構成

**ファイル**: `src/app/(main)/settings/billing/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] 請求履歴                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  請求履歴                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 2026年1月10日    ¥480    支払い済み    [領収書を見る]        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 2025年12月10日   ¥480    支払い済み    [領収書を見る]        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 2025年11月10日   ¥480    支払い済み    [領収書を見る]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ※ 請求履歴がない場合:                                          │
│  「まだ請求履歴がありません」と表示                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 コンポーネント

**ファイル**: `src/components/billing/InvoiceList.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| invoices | Invoice[] | 請求履歴配列 |

**表示項目**:
- 請求日（日本語フォーマット）
- 金額（¥480）
- ステータス（支払い済み/支払い失敗）
- 領収書リンク（外部リンク、Stripe hosted_invoice_url）

---

## 3. 設定画面ナビゲーション改善

### 3.1 サイドバー更新

**ファイル**: `src/app/(main)/settings/layout.tsx`

現在のナビゲーション:
```typescript
const settingsNav = [
  { href: "/settings/subscription", label: "サブスクリプション", icon: CreditCard },
]
```

更新後:
```typescript
const settingsNav = [
  { href: "/settings/subscription", label: "サブスクリプション", icon: CreditCard },
  { href: "/settings/billing", label: "請求履歴", icon: Receipt },
]
```

### 3.2 設定トップページ更新

**ファイル**: `src/app/(main)/settings/page.tsx`

現在: `/settings/subscription` へリダイレクト
変更なし（デフォルトはサブスクリプション管理で適切）

---

## 4. ダッシュボードへのプラン表示追加

### 4.1 現在のプラン表示バッジ

**ファイル**: `src/components/subscription/CurrentPlanBadge.tsx`

```typescript
interface CurrentPlanBadgeProps {
  planType: PlanType
  status?: SubscriptionStatus
  size?: "sm" | "md"
}
```

**表示例**:
- Freeプラン: `Free` (グレー背景)
- Proプラン: `Pro` (ゴールド/プライマリ背景、王冠アイコン付き)
- 解約予定: `Pro (解約予定)` (警告色)

### 4.2 ダッシュボードへの組み込み

**ファイル**: `src/app/(main)/dashboard/page.tsx`

ヘッダー部分にプランバッジを追加:
```
ようこそ、{name}さん [Pro] ← プランバッジ
```

---

## 5. Customer Portal連携強化

### 5.1 現状

- `ManageSubscription.tsx`に「Stripeで管理」ボタンがある
- `createPortalSession()`でCustomer Portalへ遷移

### 5.2 改善点

1. **請求履歴画面からのアクセス**
   - 「すべての請求履歴をStripeで確認」リンク追加

2. **支払い方法変更の導線**
   - サブスクリプション管理画面の支払い方法セクション維持

---

## 6. ディレクトリ構成（追加分）

```
src/
├── actions/
│   └── billing.ts                 # NEW: 請求関連Server Actions
├── app/(main)/settings/
│   └── billing/
│       └── page.tsx               # NEW: 請求履歴ページ
├── components/
│   ├── billing/
│   │   └── InvoiceList.tsx        # NEW: 請求履歴リスト
│   └── subscription/
│       └── CurrentPlanBadge.tsx   # NEW: プランバッジ
```

---

## 7. 実装タスク

### Task 1: Server Actions実装
- [ ] `src/actions/billing.ts` 作成
- [ ] `getInvoices()` 実装
- [ ] `getInvoiceUrl()` 実装

### Task 2: 請求履歴UI
- [ ] `src/components/billing/InvoiceList.tsx` 作成
- [ ] `src/app/(main)/settings/billing/page.tsx` 作成

### Task 3: 設定ナビゲーション
- [ ] `src/app/(main)/settings/layout.tsx` 更新（請求履歴リンク追加）

### Task 4: ダッシュボード改善
- [ ] `src/components/subscription/CurrentPlanBadge.tsx` 作成
- [ ] `src/app/(main)/dashboard/page.tsx` 更新（バッジ追加）

### Task 5: テスト
- [ ] E2Eテスト作成（phase6d.spec.ts）
- [ ] 請求履歴表示テスト
- [ ] プランバッジ表示テスト

### Task 6: ドキュメント更新
- [ ] CLAUDE.md 更新（Phase 6-D完了を反映）

---

## 8. 型定義

### 8.1 既存の型（src/types/subscription.ts）

```typescript
// 既に定義済み
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
```

---

## 9. セキュリティ考慮事項

| 項目 | 対応 |
|------|------|
| RLS | invoicesテーブルは既にRLS有効（Phase 6-Aで実装済み） |
| 認証チェック | 全Server Actionsで`supabase.auth.getUser()`実施 |
| 領収書URL | hosted_invoice_urlは期限付きURL、都度取得推奨 |

---

## 10. UI/UXガイドライン

### 10.1 日付フォーマット
- 日本語表記: `2026年1月10日`
- `toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })`

### 10.2 金額フォーマット
- 円記号付き: `¥480`
- `toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })`

### 10.3 ステータス表示
| ステータス | 表示 | 色 |
|-----------|------|-----|
| paid | 支払い済み | 緑（success） |
| open | 未払い | 黄（warning） |
| void | 無効 | グレー（muted） |
| uncollectible | 回収不能 | 赤（destructive） |

---

## 11. 依存関係

### 11.1 前提条件（Phase 6-A, 6-B, 6-Cで実装済み）
- invoicesテーブル（DBマイグレーション済み）
- Invoice型定義
- Stripe Webhook（invoice.paid イベントでinvoices保存）
- createPortalSession()

### 11.2 使用するshadcn/uiコンポーネント
- Card, CardHeader, CardContent
- Button
- Badge
- Table (請求履歴用)
- ExternalLink icon (lucide-react)
