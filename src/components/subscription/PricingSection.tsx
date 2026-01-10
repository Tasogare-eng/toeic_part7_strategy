"use client"

import { useState } from "react"
import { PricingCard } from "./PricingCard"
import { PlanType } from "@/types/subscription"
import { createCheckoutSession } from "@/actions/subscription"

const FREE_FEATURES = [
  { name: "長文読解 5問/日", included: true },
  { name: "文法学習 10問/日", included: true },
  { name: "単語学習 20語/日", included: true },
  { name: "基本ダッシュボード", included: true },
  { name: "模試機能", included: false },
  { name: "詳細分析", included: false },
  { name: "復習スケジュール", included: false },
  { name: "AI問題生成", included: false },
]

const PRO_FEATURES = [
  { name: "長文読解 無制限", included: true },
  { name: "文法学習 無制限", included: true },
  { name: "単語学習 無制限", included: true },
  { name: "基本ダッシュボード", included: true },
  { name: "模試機能", included: true },
  { name: "詳細分析", included: true },
  { name: "復習スケジュール", included: true },
  { name: "AI問題生成", included: true },
]

interface PricingSectionProps {
  currentPlan: PlanType
}

export function PricingSection({ currentPlan }: PricingSectionProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const result = await createCheckoutSession()
      if ("url" in result) {
        window.location.href = result.url
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <PricingCard
        plan="free"
        currentPlan={currentPlan}
        price="¥0"
        features={FREE_FEATURES}
      />
      <PricingCard
        plan="pro"
        currentPlan={currentPlan}
        price="¥480"
        features={PRO_FEATURES}
        onUpgrade={handleUpgrade}
        loading={loading}
      />
    </div>
  )
}
