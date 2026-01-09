"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle, Target, Clock } from "lucide-react"

interface VocabularyStatsProps {
  stats: {
    totalWords: number
    learned: number
    mastered: number
    accuracy: number
    reviewDue: number
  } | null
}

export function VocabularyStats({ stats }: VocabularyStatsProps) {
  if (!stats) {
    return null
  }

  const learnedPercent =
    stats.totalWords > 0 ? (stats.learned / stats.totalWords) * 100 : 0
  const masteredPercent =
    stats.totalWords > 0 ? (stats.mastered / stats.totalWords) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総単語数</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWords}</div>
          <p className="text-xs text-muted-foreground mt-1">
            学習済み: {stats.learned}語
          </p>
          <Progress value={learnedPercent} className="h-1 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">習得済み</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.mastered}</div>
          <p className="text-xs text-muted-foreground mt-1">
            習熟度4以上の単語
          </p>
          <Progress
            value={masteredPercent}
            className="h-1 mt-2 [&>div]:bg-green-500"
          />
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
          <CardTitle className="text-sm font-medium">要復習</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reviewDue}</div>
          <p className="text-xs text-muted-foreground mt-1">
            今日復習が必要な単語
          </p>
          {stats.reviewDue > 0 && (
            <div className="mt-2 text-xs text-orange-600">
              復習を始めましょう！
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
