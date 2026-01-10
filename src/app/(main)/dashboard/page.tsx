import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentActivityList } from "@/components/dashboard/RecentActivityList"
import { getProfile } from "@/actions/auth"
import { getDashboardStats, getRecentActivity } from "@/actions/progress"
import { getWeakAreas } from "@/actions/analytics"
import { getSubscription } from "@/actions/subscription"
import { BarChart3, AlertTriangle, Crown, Sparkles } from "lucide-react"

export default async function DashboardPage() {
  const [profile, stats, activities, weakAreas, subscription] = await Promise.all([
    getProfile(),
    getDashboardStats(),
    getRecentActivity(),
    getWeakAreas(),
    getSubscription(),
  ])
  const isPro =
    subscription?.planType === "pro" && subscription?.status === "active"

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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Link href="/reading">
              <Button size="lg" className="w-full">
                長文読解を始める
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Link href="/analytics">
              <Button size="lg" variant="outline" className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                学習分析を見る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 弱点アラート */}
      {(weakAreas.documentTypes.length > 0 || weakAreas.questionTypes.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              弱点が検出されました
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-3">
              以下のカテゴリで正答率が70%未満です。重点的に学習しましょう。
            </p>
            <div className="flex flex-wrap gap-2">
              {weakAreas.documentTypes.slice(0, 3).map(d => (
                <span key={d.document_type} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {d.document_type}: {d.accuracy}%
                </span>
              ))}
              {weakAreas.questionTypes.slice(0, 3).map(q => (
                <span key={q.question_type} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {q.question_type}: {q.accuracy}%
                </span>
              ))}
            </div>
            <Link href="/analytics" className="text-sm text-yellow-700 hover:underline mt-2 inline-block">
              詳細を見る →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Proプラン案内（Freeユーザーのみ） */}
      {!isPro && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Pro プランで学習を加速
            </CardTitle>
            <CardDescription>
              模試機能、詳細分析、復習スケジュールなど、すべての機能が使い放題
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                無制限の問題演習
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                模試機能
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                詳細分析
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                復習スケジュール
              </div>
            </div>
            <Link href="/pricing">
              <Button className="gap-2">
                <Crown className="h-4 w-4" />
                Pro プランを見る
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

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
