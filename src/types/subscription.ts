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
