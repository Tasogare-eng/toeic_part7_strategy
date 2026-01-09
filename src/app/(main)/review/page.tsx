import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Sparkles } from "lucide-react"
import {
  getBookmarks,
  getTodayReviewSchedule,
  getReviewStats,
  generateReviewScheduleFromMistakes,
} from "@/actions/review"
import { ReviewStats } from "@/components/review/ReviewStats"
import { BookmarksList } from "@/components/review/BookmarksList"
import { ReviewScheduleList } from "@/components/review/ReviewScheduleList"
import { revalidatePath } from "next/cache"

async function handleGenerateSchedule() {
  "use server"
  const count = await generateReviewScheduleFromMistakes()
  revalidatePath("/review")
  return count
}

export default async function ReviewPage() {
  const [bookmarks, todaySchedule, stats] = await Promise.all([
    getBookmarks(),
    getTodayReviewSchedule(),
    getReviewStats(),
  ])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">復習</h1>
          <p className="text-muted-foreground">
            ブックマークと復習スケジュールを管理
          </p>
        </div>
        <form action={handleGenerateSchedule}>
          <Button type="submit" variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            復習スケジュールを自動生成
          </Button>
        </form>
      </div>

      <Suspense fallback={<Skeleton className="h-32" />}>
        <ReviewStats stats={stats} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's review schedule */}
        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <ReviewScheduleList scheduleItems={todaySchedule} />
        </Suspense>

        {/* Bookmarks */}
        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <BookmarksList bookmarks={bookmarks} />
        </Suspense>
      </div>

      {/* Tips card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            間隔反復学習について
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            このシステムでは、エビングハウスの忘却曲線に基づいた間隔反復学習を採用しています。
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>正解した問題は、復習間隔が徐々に長くなります</li>
            <li>間違えた問題は、翌日に再度復習されます</li>
            <li>「復習スケジュールを自動生成」で、過去7日間の間違いから復習リストを作成できます</li>
            <li>定期的な復習で、長期記憶への定着を促進します</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
