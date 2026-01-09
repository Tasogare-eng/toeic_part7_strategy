import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Play, BookOpen, AlertTriangle } from "lucide-react"
import {
  getGrammarStats,
  getGrammarStatsByCategory,
  getIncorrectGrammarQuestions,
  getGrammarQuestionCount,
} from "@/actions/grammar"
import { GrammarStats } from "@/components/grammar/GrammarStats"
import { GrammarCategoryStats } from "@/components/grammar/GrammarCategoryStats"
import {
  GRAMMAR_CATEGORY_LABELS,
  GrammarCategory,
} from "@/types/grammar"

interface Props {
  searchParams: Promise<{ category?: string }>
}

const ALL_CATEGORIES: GrammarCategory[] = [
  "parts_of_speech",
  "tense",
  "relative_clause",
  "conjunction",
  "preposition",
  "subjunctive",
  "passive",
  "comparison",
  "article",
  "pronoun",
]

export default async function GrammarPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedCategory = params.category as GrammarCategory | undefined

  // すべてのデータフェッチを1つのPromise.allに統合（パフォーマンス最適化）
  const [
    stats,
    categoryStats,
    incorrectQuestions,
    ...categoryCountsRaw
  ] = await Promise.all([
    getGrammarStats(),
    getGrammarStatsByCategory(),
    getIncorrectGrammarQuestions(5),
    ...ALL_CATEGORIES.map((cat) => getGrammarQuestionCount({ category: cat })),
  ])

  // カテゴリカウントを整形
  const categoryCounts = ALL_CATEGORIES.map((category, index) => ({
    category,
    count: categoryCountsRaw[index] as number,
  }))

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">文法学習</h1>
          <p className="text-muted-foreground">
            TOEIC Part5/6形式の文法問題で実力アップ
          </p>
        </div>
        <div className="flex gap-2">
          {incorrectQuestions.length > 0 && (
            <Button asChild variant="outline">
              <Link href="/grammar/practice?mode=review">
                <AlertTriangle className="mr-2 h-4 w-4" />
                復習 ({incorrectQuestions.length})
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/grammar/practice">
              <Play className="mr-2 h-4 w-4" />
              練習を開始
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-32" />}>
        <GrammarStats stats={stats} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category stats */}
        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <GrammarCategoryStats categoryStats={categoryStats} />
        </Suspense>

        {/* Category selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              カテゴリ別練習
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {categoryCounts.map(({ category, count }) => {
                const catStats = categoryStats.find(
                  (s) => s.category === category
                )
                return (
                  <Link
                    key={category}
                    href={`/grammar/practice?category=${category}`}
                    className="block"
                  >
                    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {GRAMMAR_CATEGORY_LABELS[category]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {count}問
                        </Badge>
                      </div>
                      {catStats && (
                        <div className="mt-1 text-xs text-gray-500">
                          正答率: {catStats.accuracy}%
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent incorrect questions */}
      {incorrectQuestions.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              最近間違えた問題
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incorrectQuestions.slice(0, 3).map((q) => (
                <div
                  key={q.id}
                  className="p-3 bg-white rounded-lg border"
                >
                  <p className="text-sm line-clamp-2">{q.question_text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {GRAMMAR_CATEGORY_LABELS[q.category as GrammarCategory]}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      正解: {q.correct_answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/grammar/practice?mode=review">
                復習問題に挑戦
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
