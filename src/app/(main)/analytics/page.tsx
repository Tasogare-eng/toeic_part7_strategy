import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccuracyChart, CategoryChart, WeakAreasCard } from "@/components/analytics"
import {
  getDailyAccuracy,
  getAccuracyByDocumentType,
  getAccuracyByQuestionType,
  getAccuracyByDifficulty,
  getWeakAreas,
  getAnalyticsSummary
} from "@/actions/analytics"
import { Target, TrendingUp, Clock, BookOpen } from "lucide-react"

export default async function AnalyticsPage() {
  const [dailyData, docTypeData, questionTypeData, difficultyData, weakAreas, summary] = await Promise.all([
    getDailyAccuracy(30),
    getAccuracyByDocumentType(),
    getAccuracyByQuestionType(),
    getAccuracyByDifficulty(),
    getWeakAreas(),
    getAnalyticsSummary()
  ])

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">学習分析</h1>
        <p className="text-muted-foreground mt-1">
          学習の進捗と弱点を分析して効率的に学習しましょう
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週の問題数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.weekly.questions ?? 0}問</div>
            <p className="text-xs text-muted-foreground">
              累計: {summary?.allTime.questions ?? 0}問
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週の正答率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.weekly.accuracy ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              目標: 90%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計正答率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.allTime.accuracy ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              全期間の平均
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週の学習時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.weekly.timeMinutes ?? 0}分</div>
            <p className="text-xs text-muted-foreground">
              累計: {summary?.allTime.timeMinutes ?? 0}分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 正答率推移グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>正答率の推移</CardTitle>
          <CardDescription>過去30日間の日別正答率</CardDescription>
        </CardHeader>
        <CardContent>
          <AccuracyChart data={dailyData} />
        </CardContent>
      </Card>

      {/* カテゴリ別分析 */}
      <Tabs defaultValue="document" className="space-y-4">
        <TabsList>
          <TabsTrigger value="document">文書タイプ別</TabsTrigger>
          <TabsTrigger value="question">設問タイプ別</TabsTrigger>
          <TabsTrigger value="difficulty">難易度別</TabsTrigger>
        </TabsList>

        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle>文書タイプ別正答率</CardTitle>
              <CardDescription>
                各文書タイプでの正答率を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryChart data={docTypeData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="question">
          <Card>
            <CardHeader>
              <CardTitle>設問タイプ別正答率</CardTitle>
              <CardDescription>
                主旨把握・詳細理解・推測などタイプ別の正答率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryChart data={questionTypeData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulty">
          <Card>
            <CardHeader>
              <CardTitle>難易度別正答率</CardTitle>
              <CardDescription>
                TOEICスコア帯別の難易度での正答率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryChart data={difficultyData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 弱点分析 */}
      <WeakAreasCard weakAreas={weakAreas} />
    </div>
  )
}
