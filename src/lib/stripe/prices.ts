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
