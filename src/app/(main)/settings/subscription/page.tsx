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
