"use client"

import type { MockExamQuestionWithData } from "@/types/mock-exam"

interface MockExamProgressProps {
  questions: MockExamQuestionWithData[]
  currentIndex: number
  answers: Record<string, string>
  onNavigate: (index: number) => void
}

export function MockExamProgress({
  questions,
  currentIndex,
  answers,
  onNavigate,
}: MockExamProgressProps) {
  // パートごとにグループ化
  const grouped = questions.reduce(
    (acc, q, index) => {
      if (!acc[q.part]) {
        acc[q.part] = []
      }
      acc[q.part].push({ question: q, index })
      return acc
    },
    {} as Record<string, { question: MockExamQuestionWithData; index: number }[]>
  )

  const partLabels: Record<string, string> = {
    part5: "Part 5",
    part6: "Part 6",
    part7: "Part 7",
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([part, items]) => (
        <div key={part}>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {partLabels[part]} ({items.filter((i) => answers[i.question.id]).length}/
            {items.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {items.map(({ question, index }) => {
              const isAnswered = !!answers[question.id]
              const isCurrent = index === currentIndex

              return (
                <button
                  key={question.id}
                  onClick={() => onNavigate(index)}
                  className={`
                    w-8 h-8 text-xs font-medium rounded
                    transition-colors
                    ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isAnswered
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted hover:bg-muted/80"
                    }
                  `}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
