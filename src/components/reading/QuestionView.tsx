"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { submitAnswers } from "@/actions/reading"
import type { PassageWithQuestions } from "@/types/database"

interface QuestionViewProps {
  passage: PassageWithQuestions
}

export function QuestionView({ passage }: QuestionViewProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const questionStartTimeRef = useRef<number>(0)
  const [timesSpent, setTimesSpent] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初期化時とインデックス変更時にタイマーをリセット
  useEffect(() => {
    questionStartTimeRef.current = Date.now()
  }, [currentIndex])

  const currentQuestion = passage.questions[currentIndex]
  const isLastQuestion = currentIndex === passage.questions.length - 1
  const hasAnswered = answers[currentQuestion.id] !== undefined

  function handleAnswerChange(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: parseInt(value),
    }))
  }

  async function handleNext() {
    // 経過時間を記録
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    const updatedTimesSpent = {
      ...timesSpent,
      [currentQuestion.id]: timeSpent,
    }
    setTimesSpent(updatedTimesSpent)

    if (isLastQuestion) {
      await handleSubmit(updatedTimesSpent)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  async function handleSubmit(finalTimesSpent: Record<string, number>) {
    setIsSubmitting(true)

    const answerData = passage.questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] ?? -1,
      timeSpent: finalTimesSpent[q.id] ?? 0,
    }))

    await submitAnswers(passage.id, answerData)
    router.push(`/results?passageId=${passage.id}`)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 本文 */}
      <Card>
        <CardContent className="pt-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {passage.content}
          </pre>
        </CardContent>
      </Card>

      {/* 設問 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            問題 {currentIndex + 1} / {passage.questions.length}
          </span>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-medium">{currentQuestion.question_text}</p>

            <RadioGroup
              key={currentQuestion.id}
              value={answers[currentQuestion.id]?.toString() ?? ""}
              onValueChange={handleAnswerChange}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${currentQuestion.id}-${index}`} />
                  <Label htmlFor={`option-${currentQuestion.id}-${index}`} className="cursor-pointer">
                    ({String.fromCharCode(65 + index)}) {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            disabled={currentIndex === 0}
          >
            前へ
          </Button>
          <Button onClick={handleNext} disabled={!hasAnswered || isSubmitting}>
            {isSubmitting
              ? "送信中..."
              : isLastQuestion
              ? "結果を見る"
              : "次へ"}
          </Button>
        </div>
      </div>
    </div>
  )
}
