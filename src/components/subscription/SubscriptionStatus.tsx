import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Subscription } from "@/types/subscription"
import { PRICE_DISPLAY } from "@/lib/stripe/prices"

interface SubscriptionStatusProps {
  subscription: Subscription | null
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const isPro =
    subscription?.planType === "pro" && subscription?.status === "active"

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
          {isPro ? `${PRICE_DISPLAY.PRO_MONTHLY.label}` : "無料プラン"}
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
