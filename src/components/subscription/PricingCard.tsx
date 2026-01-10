"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { PlanType } from "@/types/subscription"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  plan: "free" | "pro"
  currentPlan: PlanType
  price: string
  features: { name: string; included: boolean }[]
  onUpgrade?: () => void
  loading?: boolean
}

export function PricingCard({
  plan,
  currentPlan,
  price,
  features,
  onUpgrade,
  loading,
}: PricingCardProps) {
  const isPro = plan === "pro"
  const isCurrentPlan = currentPlan === plan

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPro && "border-primary shadow-lg"
      )}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            おすすめ
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-xl">
          {isPro ? "Pro プラン" : "Free プラン"}
        </CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{price}</span>
          {isPro && <span className="text-muted-foreground">/月</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature.name} className="flex items-center gap-2">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm",
                  !feature.included && "text-muted-foreground"
                )}
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button className="w-full" variant="outline" disabled>
            現在のプラン
          </Button>
        ) : isPro ? (
          <Button className="w-full" onClick={onUpgrade} disabled={loading}>
            {loading ? "処理中..." : "Pro にアップグレード"}
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            無料で始める
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
