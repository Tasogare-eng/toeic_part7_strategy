"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
} from "lucide-react"
import { GrammarQuestionCard } from "./GrammarQuestionCard"
import type { GrammarQuestion } from "@/types/grammar"

interface GrammarPracticeSessionProps {
  questions: GrammarQuestion[]
}

interface QuestionResult {
  question: GrammarQuestion
  isCorrect: boolean
}

export function GrammarPracticeSession({
  questions,
}: GrammarPracticeSessionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [showNext, setShowNext] = useState(false)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isComplete = currentIndex >= questions.length

  const handleComplete = (isCorrect: boolean) => {
    setResults((prev) => [...prev, { question: currentQuestion, isCorrect }])
    setShowNext(true)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setShowNext(false)
    } else {
      // Mark as complete
      setCurrentIndex(questions.length)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setResults([])
    setShowNext(false)
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">練習する問題がありません</p>
          <Button onClick={() => router.push("/grammar")}>
            文法学習に戻る
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show results
  if (isComplete) {
    const correctCount = results.filter((r) => r.isCorrect).length
    const incorrectCount = results.length - correctCount
    const accuracy = Math.round((correctCount / results.length) * 100)

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">練習完了！</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-blue-600">{accuracy}%</p>
            <p className="text-gray-500 mt-2">正答率</p>
          </div>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{correctCount}</span>
              </div>
              <p className="text-sm text-gray-500">正解</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{incorrectCount}</span>
              </div>
              <p className="text-sm text-gray-500">不正解</p>
            </div>
          </div>

          {incorrectCount > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">間違えた問題:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results
                  .filter((r) => !r.isCorrect)
                  .map((r, i) => (
                    <div
                      key={i}
                      className="text-sm p-3 bg-red-50 rounded-lg"
                    >
                      <p className="text-gray-700 line-clamp-2">
                        {r.question.question_text}
                      </p>
                      <p className="text-red-600 mt-1">
                        正解: {r.question.correct_answer}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/grammar")}
            >
              <Home className="mr-2 h-4 w-4" />
              戻る
            </Button>
            <Button className="flex-1" onClick={handleRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              もう一度
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            問題 {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-gray-500">
            正解: {results.filter((r) => r.isCorrect).length} /{" "}
            {results.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <GrammarQuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onComplete={handleComplete}
      />

      {/* Next button */}
      {showNext && (
        <div className="flex justify-end">
          <Button onClick={handleNext} size="lg">
            {currentIndex < questions.length - 1 ? (
              <>
                次の問題
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "結果を見る"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
