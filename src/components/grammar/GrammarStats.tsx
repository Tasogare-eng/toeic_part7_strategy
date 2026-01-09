"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FileQuestion, CheckCircle, Target, Clock } from "lucide-react"

interface GrammarStatsProps {
  stats: {
    totalQuestions: number
    totalAnswered: number
    accuracy: number
    averageTime: number
  } | null
}

export function GrammarStats({ stats }: GrammarStatsProps) {
  if (!stats) {
    return null
  }

  const answeredPercent =
    stats.totalQuestions > 0
      ? (stats.totalAnswered / stats.totalQuestions) * 100
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総問題数</CardTitle>
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalQuestions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            解答済み: {stats.totalAnswered}問
          </p>
          <Progress value={answeredPercent} className="h-1 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">解答数</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAnswered}</div>
          <p className="text-xs text-muted-foreground mt-1">
            これまでの総解答数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">正答率</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.accuracy}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            全体の正答率
          </p>
          <Progress
            value={stats.accuracy}
            className="h-1 mt-2 [&>div]:bg-blue-500"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均解答時間</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageTime}秒</div>
          <p className="text-xs text-muted-foreground mt-1">
            1問あたりの平均時間
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
