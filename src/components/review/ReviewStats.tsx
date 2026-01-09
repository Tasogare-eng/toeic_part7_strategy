"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bookmark, Clock, CheckCircle } from "lucide-react"

interface ReviewStatsProps {
  stats: {
    totalBookmarks: number
    pendingReviews: number
    completedToday: number
  }
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ブックマーク</CardTitle>
          <Bookmark className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBookmarks}</div>
          <p className="text-xs text-muted-foreground mt-1">
            保存済みのアイテム
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">要復習</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingReviews}</div>
          <p className="text-xs text-muted-foreground mt-1">
            今日復習が必要なアイテム
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">完了</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedToday}</div>
          <p className="text-xs text-muted-foreground mt-1">
            今日完了した復習
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
