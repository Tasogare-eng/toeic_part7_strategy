import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, BookOpen, Clock, Filter } from "lucide-react"
import {
  getVocabulary,
  getVocabularyStats,
  getTodayReviewVocabulary,
} from "@/actions/vocabulary"
import { VocabularyStats } from "@/components/vocabulary/VocabularyStats"
import { VocabularyList } from "@/components/vocabulary/VocabularyList"
import { LEVEL_LABELS, VocabularyLevel, VocabularyCategory } from "@/types/vocabulary"

interface Props {
  searchParams: Promise<{ level?: string; category?: string }>
}

export default async function VocabularyPage({ searchParams }: Props) {
  const params = await searchParams
  const level = params.level ? (parseInt(params.level) as VocabularyLevel) : undefined
  const category = params.category as VocabularyCategory | undefined

  const [vocabularies, stats, todayReview] = await Promise.all([
    getVocabulary({ level, category, limit: 50 }),
    getVocabularyStats(),
    getTodayReviewVocabulary(),
  ])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">単語学習</h1>
          <p className="text-muted-foreground">
            TOEIC頻出単語をフラッシュカードで学習
          </p>
        </div>
        <div className="flex gap-2">
          {todayReview.length > 0 && (
            <Button asChild variant="outline">
              <Link href="/vocabulary/flashcard?mode=review">
                <Clock className="mr-2 h-4 w-4" />
                復習 ({todayReview.length})
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/vocabulary/flashcard">
              <Play className="mr-2 h-4 w-4" />
              学習を開始
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-32" />}>
        <VocabularyStats stats={stats} />
      </Suspense>

      {/* Level filter tabs */}
      <Tabs defaultValue={level?.toString() || "all"} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href="/vocabulary">すべて</Link>
            </TabsTrigger>
            {([1, 2, 3, 4] as VocabularyLevel[]).map((l) => (
              <TabsTrigger key={l} value={l.toString()} asChild>
                <Link href={`/vocabulary?level=${l}`}>
                  {LEVEL_LABELS[l]}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={level?.toString() || "all"} className="space-y-4">
          {todayReview.length > 0 && !level && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  今日の復習
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {todayReview.length}個の単語が復習の時期です
                </p>
                <Button asChild size="sm">
                  <Link href="/vocabulary/flashcard?mode=review">
                    復習を始める
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                単語一覧
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({vocabularies.length}語)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <VocabularyList vocabularies={vocabularies} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
