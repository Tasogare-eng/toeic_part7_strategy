"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_EXAM_CONFIGS, type MockExamType } from "@/types/mock-exam"
import { startMockExam } from "@/actions/mock-exam"
import { Clock, FileText, Loader2 } from "lucide-react"

export function MockExamSelector() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState<MockExamType | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleStart(examType: MockExamType) {
    setIsStarting(examType)
    setError(null)

    try {
      const { examId } = await startMockExam(examType)
      router.push(`/mock-exam/${examId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "模試の開始に失敗しました")
      setIsStarting(null)
    }
  }

  const examTypes: MockExamType[] = ["full", "mini_30", "mini_15"]

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {examTypes.map((type) => {
          const config = MOCK_EXAM_CONFIGS[type]
          const totalQuestions =
            config.part5Count + config.part6Count + config.part7Count

          return (
            <Card key={type} className="relative">
              <CardHeader>
                <CardTitle>{config.label}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{config.timeLimit}分</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{totalQuestions}問</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {config.part5Count > 0 && (
                    <div>Part5: {config.part5Count}問</div>
                  )}
                  {config.part6Count > 0 && (
                    <div>Part6: {config.part6Count}問</div>
                  )}
                  {config.part7Count > 0 && (
                    <div>Part7: {config.part7Count}問</div>
                  )}
                </div>

                <Button
                  onClick={() => handleStart(type)}
                  disabled={isStarting !== null}
                  className="w-full"
                >
                  {isStarting === type ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      準備中...
                    </>
                  ) : (
                    "開始する"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
