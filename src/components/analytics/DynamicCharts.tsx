"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { DailyStats, CategoryStats } from "@/actions/analytics"

// 動的インポートでチャートを遅延読み込み
const AccuracyChartLazy = dynamic(
  () => import("./AccuracyChart").then(mod => ({ default: mod.AccuracyChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false
  }
)

const CategoryChartLazy = dynamic(
  () => import("./CategoryChart").then(mod => ({ default: mod.CategoryChart })),
  {
    loading: () => <Skeleton className="h-[200px] w-full" />,
    ssr: false
  }
)

// 動的インポート対応のチャートコンポーネント
export function DynamicAccuracyChart({ data }: { data: DailyStats[] }) {
  return <AccuracyChartLazy data={data} />
}

export function DynamicCategoryChart({ data }: { data: CategoryStats[] }) {
  return <CategoryChartLazy data={data} />
}
