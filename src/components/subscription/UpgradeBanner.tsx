"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpgradeBannerProps {
  variant?: "inline" | "card"
  title?: string
  description?: string
  className?: string
}

export function UpgradeBanner({
  variant = "card",
  title = "Pro プランで制限なしに学習",
  description = "月額480円で全機能が使い放題になります",
  className,
}: UpgradeBannerProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg",
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm flex-1">{title}</span>
        <Link href="/pricing">
          <Button size="sm" variant="ghost">
            詳細 <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-br from-primary/5 to-background",
        className
      )}
    >
      <CardContent className="p-6 text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Link href="/pricing">
          <Button>Pro にアップグレード</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
