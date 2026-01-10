"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface UsageMeterProps {
  label: string
  current: number
  limit: number | null // null = 無制限
  showRemaining?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UsageMeter({
  label,
  current,
  limit,
  showRemaining = true,
  size = "md",
  className,
}: UsageMeterProps) {
  const isUnlimited = limit === null
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const remaining = isUnlimited ? null : Math.max(limit - current, 0)
  const isNearLimit = !isUnlimited && remaining !== null && remaining <= 2
  const isAtLimit = !isUnlimited && remaining === 0

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium",
            isAtLimit && "text-red-500",
            isNearLimit && !isAtLimit && "text-orange-500"
          )}
        >
          {isUnlimited ? (
            "無制限"
          ) : showRemaining ? (
            `残り ${remaining}回`
          ) : (
            `${current}/${limit}`
          )}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            size === "sm" && "h-1",
            size === "md" && "h-2",
            size === "lg" && "h-3",
            isAtLimit && "[&>div]:bg-red-500",
            isNearLimit && !isAtLimit && "[&>div]:bg-orange-500"
          )}
        />
      )}
    </div>
  )
}
