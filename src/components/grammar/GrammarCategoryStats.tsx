"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  GRAMMAR_CATEGORY_LABELS,
  GrammarCategory,
} from "@/types/grammar"

interface CategoryStat {
  category: GrammarCategory
  total_answers: number
  correct_count: number
  accuracy: number
}

interface GrammarCategoryStatsProps {
  categoryStats: CategoryStat[]
}

export function GrammarCategoryStats({
  categoryStats,
}: GrammarCategoryStatsProps) {
  if (categoryStats.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          まだ解答データがありません
        </CardContent>
      </Card>
    )
  }

  // Sort by accuracy ascending (weakest first)
  const sortedStats = [...categoryStats].sort((a, b) => a.accuracy - b.accuracy)

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600"
    if (accuracy >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (accuracy >= 60) return <Minus className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getProgressColor = (accuracy: number) => {
    if (accuracy >= 80) return "[&>div]:bg-green-500"
    if (accuracy >= 60) return "[&>div]:bg-yellow-500"
    return "[&>div]:bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">カテゴリ別正答率</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedStats.map((stat) => (
            <div key={stat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAccuracyIcon(stat.accuracy)}
                  <span className="font-medium">
                    {GRAMMAR_CATEGORY_LABELS[stat.category]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {stat.correct_count}/{stat.total_answers}問
                  </span>
                  <span
                    className={`font-bold ${getAccuracyColor(stat.accuracy)}`}
                  >
                    {stat.accuracy}%
                  </span>
                </div>
              </div>
              <Progress
                value={stat.accuracy}
                className={`h-2 ${getProgressColor(stat.accuracy)}`}
              />
            </div>
          ))}
        </div>

        {/* Weak areas highlight */}
        {sortedStats.some((s) => s.accuracy < 60) && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-2">
              強化が必要なカテゴリ
            </p>
            <div className="flex flex-wrap gap-2">
              {sortedStats
                .filter((s) => s.accuracy < 60)
                .map((s) => (
                  <Badge
                    key={s.category}
                    variant="outline"
                    className="border-red-300 text-red-700"
                  >
                    {GRAMMAR_CATEGORY_LABELS[s.category]}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
