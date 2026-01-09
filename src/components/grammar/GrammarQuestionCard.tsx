"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Lightbulb } from "lucide-react"
import { Timer } from "@/components/common/Timer"
import { BookmarkButton } from "@/components/common/BookmarkButton"
import { submitGrammarAnswer } from "@/actions/grammar"
import { getGrammarRecommendedTime } from "@/lib/timer-utils"
import type { GrammarQuestion } from "@/types/grammar"
import { GRAMMAR_CATEGORY_LABELS, GrammarCategory } from "@/types/grammar"

interface GrammarQuestionCardProps {
  question: GrammarQuestion
  onComplete?: (isCorrect: boolean) => void
  showTimer?: boolean
  isBookmarked?: boolean
}

export function GrammarQuestionCard({
  question,
  onComplete,
  showTimer = true,
  isBookmarked = false,
}: GrammarQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [result, setResult] = useState<{
    isCorrect: boolean
    correctAnswer: string
  } | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isPending, startTransition] = useTransition()

  const recommendedTime = getGrammarRecommendedTime(question.difficulty)

  const handleSubmit = () => {
    if (!selectedAnswer || isPending) return

    startTransition(async () => {
      try {
        const response = await submitGrammarAnswer(
          question.id,
          selectedAnswer,
          timeSpent
        )
        setResult(response)
        onComplete?.(response.isCorrect)
      } catch (error) {
        console.error("Failed to submit answer:", error)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {GRAMMAR_CATEGORY_LABELS[question.category as GrammarCategory]}
            </Badge>
            <Badge variant="outline">難易度 {question.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {showTimer && !result && (
              <Timer
                onTimeUpdate={setTimeSpent}
                recommendedTime={recommendedTime}
              />
            )}
            <BookmarkButton
              itemType="grammar"
              itemId={question.id}
              isBookmarked={isBookmarked}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question text */}
        <p className="text-lg leading-relaxed">{question.question_text}</p>

        {/* Options */}
        <RadioGroup
          value={selectedAnswer}
          onValueChange={setSelectedAnswer}
          disabled={!!result || isPending}
          className="space-y-3"
        >
          {question.options.map((option, index) => {
            const letter = option.charAt(0)
            const isCorrect = result && letter === result.correctAnswer
            const isSelected = letter === selectedAnswer
            const isWrong = result && isSelected && !result.isCorrect

            return (
              <div
                key={index}
                className={`
                  flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors
                  ${!result ? "hover:bg-gray-50 cursor-pointer" : ""}
                  ${isCorrect ? "bg-green-50 border-green-500" : ""}
                  ${isWrong ? "bg-red-50 border-red-500" : ""}
                  ${!result && isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                `}
              >
                <RadioGroupItem value={letter} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option}
                </Label>
                {isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                {isWrong && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
            )
          })}
        </RadioGroup>

        {/* Submit button */}
        {!result && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? "送信中..." : "回答する"}
          </Button>
        )}

        {/* Result and explanation */}
        {result && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                result.isCorrect ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-bold text-green-700">正解！</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="font-bold text-red-700">
                      不正解 - 正解は {result.correctAnswer}
                    </p>
                  </>
                )}
              </div>
              <p className="text-gray-700">{question.explanation}</p>
            </div>

            {question.grammar_point && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-blue-700">文法ポイント</p>
                </div>
                <p className="text-gray-700">{question.grammar_point}</p>
              </div>
            )}

            <div className="text-sm text-gray-500 text-right">
              解答時間: {Math.floor(timeSpent / 60)}分{timeSpent % 60}秒
              {timeSpent > recommendedTime && (
                <span className="text-orange-500 ml-2">
                  (推奨時間超過)
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
