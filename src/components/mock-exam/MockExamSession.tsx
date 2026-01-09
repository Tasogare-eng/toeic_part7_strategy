"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MockExamTimer } from "./MockExamTimer"
import { MockExamProgress } from "./MockExamProgress"
import { MockExamQuestion } from "./MockExamQuestion"
import {
  submitMockExamAnswer,
  completeMockExam,
  abandonMockExam,
} from "@/actions/mock-exam"
import type { MockExam, MockExamQuestionWithData } from "@/types/mock-exam"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flag,
  XCircle,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MockExamSessionProps {
  exam: MockExam
  questions: MockExamQuestionWithData[]
  initialAnswers: Record<string, string>
}

export function MockExamSession({
  exam,
  questions,
  initialAnswers,
}: MockExamSessionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAbandoning, setIsAbandoning] = useState(false)

  const currentQuestion = questions[currentIndex]
  const startTime = new Date(exam.started_at)

  const handleAnswer = async (answer: string) => {
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))

    try {
      await submitMockExamAnswer(exam.id, currentQuestion.id, answer, timeSpent)
    } catch (error) {
      console.error("Failed to submit answer:", error)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleNavigate = (index: number) => {
    setCurrentIndex(index)
    setQuestionStartTime(Date.now())
  }

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await completeMockExam(exam.id)
      router.push(`/mock-exam/${exam.id}/result`)
    } catch (error) {
      console.error("Failed to complete exam:", error)
      setIsSubmitting(false)
    }
  }, [exam.id, router])

  const handleTimeUp = useCallback(() => {
    handleComplete()
  }, [handleComplete])

  const handleAbandon = async () => {
    setIsAbandoning(true)
    try {
      await abandonMockExam(exam.id)
      router.push("/mock-exam")
    } catch (error) {
      console.error("Failed to abandon exam:", error)
      setIsAbandoning(false)
    }
  }

  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MockExamTimer
            startTime={startTime}
            totalMinutes={exam.time_limit_minutes}
            onTimeUp={handleTimeUp}
          />
          <div className="text-sm text-muted-foreground">
            {answeredCount} / {questions.length} 回答済み
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <XCircle className="mr-2 h-4 w-4" />
                中断
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>模試を中断しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  中断すると、この模試は記録されません。本当に中断しますか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>続ける</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAbandon}
                  disabled={isAbandoning}
                >
                  {isAbandoning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "中断する"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm">
                <Flag className="mr-2 h-4 w-4" />
                提出
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>模試を提出しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  {unansweredCount > 0 ? (
                    <>
                      まだ{unansweredCount}問が未回答です。提出してもよろしいですか？
                    </>
                  ) : (
                    "全ての問題に回答済みです。提出しますか？"
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>続ける</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleComplete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "提出する"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_250px] gap-6">
        {/* メインコンテンツ */}
        <div className="space-y-4">
          <MockExamQuestion
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
            questionNumber={currentIndex + 1}
          />

          {/* ナビゲーションボタン */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              前の問題
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
            >
              次の問題
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* サイドバー（進捗） */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <MockExamProgress
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
