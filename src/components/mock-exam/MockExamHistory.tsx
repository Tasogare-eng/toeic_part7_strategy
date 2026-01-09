"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { MockExamResultWithExam } from "@/types/mock-exam"
import { MOCK_EXAM_CONFIGS } from "@/types/mock-exam"
import { Clock, Target, ChevronRight } from "lucide-react"

interface MockExamHistoryProps {
  results: MockExamResultWithExam[]
}

export function MockExamHistory({ results }: MockExamHistoryProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <p>まだ模試を受験していません</p>
            <Link href="/mock-exam">
              <Button className="mt-4">模試を受ける</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const config = MOCK_EXAM_CONFIGS[result.mock_exam.exam_type]
        const accuracy = Math.round(
          (result.correct_count / result.total_questions) * 100
        )

        return (
          <Link
            key={result.id}
            href={`/mock-exam/${result.mock_exam_id}/result`}
          >
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-2xl font-bold text-primary">
                        {result.estimated_score}点
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(result.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {result.correct_count}/{result.total_questions} ({accuracy}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(result.total_time_seconds)}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
