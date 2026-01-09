"use client"

import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { MockExamQuestionWithData } from "@/types/mock-exam"

interface MockExamQuestionProps {
  question: MockExamQuestionWithData
  selectedAnswer: string | undefined
  onAnswer: (answer: string) => void
  questionNumber: number
}

export function MockExamQuestion({
  question,
  selectedAnswer,
  onAnswer,
  questionNumber,
}: MockExamQuestionProps) {
  // 文法問題の場合
  if (question.question_type === "grammar" && question.grammar_question) {
    const gq = question.grammar_question
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Q{questionNumber}
            </span>
            <span className="text-xs px-2 py-0.5 bg-muted rounded">
              Part {question.part.replace("part", "")}
            </span>
          </div>

          <p className="text-lg leading-relaxed">{gq.question_text}</p>

          <RadioGroup
            value={selectedAnswer}
            onValueChange={onAnswer}
            className="space-y-2"
          >
            {gq.options.map((option, index) => {
              const letter = option.charAt(0)
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedAnswer === letter
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={letter} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>
    )
  }

  // 長文問題の場合
  if (question.question_type === "reading" && question.reading_question) {
    const rq = question.reading_question
    const passage = question.passage

    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {/* パッセージ */}
        {passage && (
          <Card className="lg:max-h-[600px] overflow-auto">
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground mb-2">
                {passage.document_type.toUpperCase()}
              </div>
              <h3 className="font-bold mb-4">{passage.title}</h3>
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                {passage.content}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 設問 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Q{questionNumber}
              </span>
              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                Part {question.part.replace("part", "")}
              </span>
            </div>

            <p className="text-lg leading-relaxed">{rq.question_text}</p>

            <RadioGroup
              value={selectedAnswer}
              onValueChange={onAnswer}
              className="space-y-2"
            >
              {rq.options.map((option, index) => {
                const letter = ["A", "B", "C", "D"][index]
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedAnswer === letter
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={letter} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {letter}) {option}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">問題を読み込めませんでした</p>
      </CardContent>
    </Card>
  )
}
