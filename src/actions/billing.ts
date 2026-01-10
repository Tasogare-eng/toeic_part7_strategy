"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { Invoice, toInvoice } from "@/types/subscription"

/**
 * 請求履歴を取得
 */
export async function getInvoices(limit: number = 12): Promise<Invoice[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(toInvoice)
}

/**
 * 領収書URLを取得（Stripeから最新のURLを取得）
 */
export async function getInvoiceUrl(
  stripeInvoiceId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  // 該当の請求がユーザーのものか確認
  const { data: invoice } = await supabase
    .from("invoices")
    .select("stripe_invoice_id")
    .eq("user_id", user.id)
    .eq("stripe_invoice_id", stripeInvoiceId)
    .single()

  if (!invoice) {
    return { error: "請求が見つかりません" }
  }

  try {
    const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId)

    if (stripeInvoice.hosted_invoice_url) {
      return { url: stripeInvoice.hosted_invoice_url }
    }

    return { error: "領収書URLが見つかりません" }
  } catch (error) {
    console.error("Get invoice URL error:", error)
    return { error: "領収書の取得に失敗しました" }
  }
}
