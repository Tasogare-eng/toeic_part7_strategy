import { PlanType, SubscriptionStatus } from "@/types/subscription"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CurrentPlanBadgeProps {
  planType: PlanType
  status?: SubscriptionStatus
  cancelAtPeriodEnd?: boolean
  size?: "sm" | "md"
}

export function CurrentPlanBadge({
  planType,
  status,
  cancelAtPeriodEnd,
  size = "md",
}: CurrentPlanBadgeProps) {
  const isPro = planType === "pro" && status === "active"
  const isCanceling = isPro && cancelAtPeriodEnd

  if (isCanceling) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-yellow-500 text-yellow-600 bg-yellow-50",
          size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
        )}
      >
        <Crown className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        Pro (解約予定)
      </Badge>
    )
  }

  if (isPro) {
    return (
      <Badge
        className={cn(
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
          size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
        )}
      >
        <Crown className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        Pro
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={cn(size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1")}
    >
      Free
    </Badge>
  )
}
