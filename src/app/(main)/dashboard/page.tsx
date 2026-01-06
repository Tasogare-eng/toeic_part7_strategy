import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentActivityList } from "@/components/dashboard/RecentActivityList"
import { getProfile } from "@/actions/auth"
import { getDashboardStats, getRecentActivity } from "@/actions/progress"

export default async function DashboardPage() {
  const [profile, stats, activities] = await Promise.all([
    getProfile(),
    getDashboardStats(),
    getRecentActivity(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        ようこそ、{profile?.name || "ゲスト"}さん
      </h1>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="総解答数"
          value={`${stats?.totalAnswered || 0}問`}
        />
        <StatsCard
          title="正答率"
          value={`${stats?.accuracyRate || 0}%`}
          description={`${stats?.correctCount || 0}問正解`}
        />
        <StatsCard
          title="目標達成度"
          value={`${stats?.targetProgress || 0}%`}
          description="目標: 90%正答率"
        />
      </div>

      {/* 学習開始ボタン */}
      <Card>
        <CardContent className="pt-6">
          <Link href="/reading">
            <Button size="lg" className="w-full">
              長文読解を始める
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 最近の学習 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の学習</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityList activities={activities} />
        </CardContent>
      </Card>
    </div>
  )
}
