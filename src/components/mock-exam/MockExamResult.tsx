"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MockExamResultWithExam } from "@/types/mock-exam"
import { MOCK_EXAM_CONFIGS } from "@/types/mock-exam"
import { Trophy, Clock, Target, TrendingUp } from "lucide-react"

interface MockExamResultProps {
  result: MockExamResultWithExam
}

export function MockExamResult({ result }: MockExamResultProps) {
  const config = MOCK_EXAM_CONFIGS[result.mock_exam.exam_type]
  const accuracy = Math.round((result.correct_count / result.total_questions) * 100)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-yellow-600"
    if (score >= 600) return "text-green-600"
    if (score >= 400) return "text-blue-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-6">
      {/* メインスコア */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">{config.label} 結果</div>
              <div
                className={`text-5xl font-bold ${getScoreColor(result.estimated_score || 0)}`}
              >
                {result.estimated_score}
              </div>
              <div className="text-sm text-muted-foreground">予測スコア</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* サマリーカード */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/30">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">正答率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {result.correct_count}/{result.total_questions}
                </div>
                <div className="text-sm text-muted-foreground">正解数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900/30">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatTime(result.total_time_seconds)}
                </div>
                <div className="text-sm text-muted-foreground">所要時間</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* パート別結果 */}
      <Card>
        <CardHeader>
          <CardTitle>パート別結果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {result.part5_total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Part 5 (文法)</span>
                <span>
                  {result.part5_correct}/{result.part5_total} (
                  {Math.round((result.part5_correct / result.part5_total) * 100)}
                  %)
                </span>
              </div>
              <Progress
                value={(result.part5_correct / result.part5_total) * 100}
                className="h-2"
              />
            </div>
          )}

          {result.part6_total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Part 6 (文法)</span>
                <span>
                  {result.part6_correct}/{result.part6_total} (
                  {Math.round((result.part6_correct / result.part6_total) * 100)}
                  %)
                </span>
              </div>
              <Progress
                value={(result.part6_correct / result.part6_total) * 100}
                className="h-2"
              />
            </div>
          )}

          {result.part7_total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Part 7 (長文読解)</span>
                <span>
                  {result.part7_correct}/{result.part7_total} (
                  {Math.round((result.part7_correct / result.part7_total) * 100)}
                  %)
                </span>
              </div>
              <Progress
                value={(result.part7_correct / result.part7_total) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
