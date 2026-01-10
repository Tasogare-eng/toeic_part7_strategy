"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureLockProps {
  feature: string
  variant?: "overlay" | "replace"
  children?: React.ReactNode
  className?: string
}

export function FeatureLock({
  feature,
  variant = "overlay",
  children,
  className,
}: FeatureLockProps) {
  if (variant === "replace") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">
          {feature}は Pro 限定機能です
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          アップグレードすると全機能が利用可能になります
        </p>
        <Link href="/pricing">
          <Button>
            <Crown className="mr-2 h-4 w-4" />
            Pro にアップグレード
          </Button>
        </Link>
      </div>
    )
  }

  // Overlay variant
  return (
    <div className={cn("relative", className)}>
      <div className="opacity-30 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-4">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium mb-2">Pro 限定</p>
          <Link href="/pricing">
            <Button size="sm">アップグレード</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
