import { redirect } from "next/navigation"
import Link from "next/link"
import { getPassageResults } from "@/actions/reading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QUESTION_TYPES } from "@/lib/constants"
import type { ReadingQuestion } from "@/types/database"

interface Props {
  searchParams: Promise<{ passageId?: string }>
}

export default async function ResultsPage({ searchParams }: Props) {
  const { passageId } = await searchParams

  if (!passageId) {
    redirect("/reading")
  }

  const results = await getPassageResults(passageId)

  if (!results) {
    redirect("/reading")
  }

  const { passage, questions, answers } = results
  const answersMap = answers.reduce((acc, answer) => {
    acc[answer.question_id] = answer
    return acc
  }, {} as Record<string, typeof answers[0]>)

  // フロントエンド側で正解数を計算（DBの is_correct に依存しない）
  const correctCount = questions.filter((q: ReadingQuestion) => {
    const answer = answersMap[q.id]
    return answer?.selected_answer === q.correct_answer
  }).length
  const accuracy = Math.round((correctCount / questions.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">結果</h1>
        <Link href="/reading">
          <Button variant="outline">問題一覧に戻る</Button>
        </Link>
      </div>

      {/* 結果サマリー */}
      <Card>
        <CardHeader>
          <CardTitle>{passage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">正答率</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{correctCount}</p>
              <p className="text-sm text-muted-foreground">正解数</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{questions.length}</p>
              <p className="text-sm text-muted-foreground">問題数</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 問題ごとの結果 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">問題別結果</h2>
        {questions.map((question: ReadingQuestion, index: number) => {
          const answer = answersMap[question.id]
          const selectedAnswer = answer?.selected_answer
          const correctAnswer = question.correct_answer
          const isCorrect = selectedAnswer === correctAnswer

          return (
            <Card key={question.id} className={isCorrect ? "border-green-200" : "border-red-200"}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">
                      Q{index + 1}. {question.question_text}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isCorrect ? "正解" : "不正解"}
                  </span>
                </div>

                {/* あなたの回答と正解の表示 */}
                <div className="text-sm space-y-1 p-3 bg-gray-50 rounded-md">
                  <p>
                    <span className="font-medium">あなたの回答:</span>{" "}
                    {selectedAnswer !== undefined && selectedAnswer >= 0
                      ? `(${String.fromCharCode(65 + selectedAnswer)}) ${question.options[selectedAnswer]}`
                      : "未回答"}
                  </p>
                  <p>
                    <span className="font-medium">正解:</span>{" "}
                    ({String.fromCharCode(65 + correctAnswer)}) {question.options[correctAnswer]}
                  </p>
                </div>

                <div className="space-y-2">
                  {question.options.map((option: string, optIndex: number) => {
                    const isSelected = selectedAnswer === optIndex
                    const isCorrectOption = correctAnswer === optIndex

                    let className = "p-2 rounded text-sm flex items-center justify-between"
                    if (isCorrectOption && isSelected) {
                      className += " bg-green-100 border border-green-300"
                    } else if (isCorrectOption) {
                      className += " bg-green-50 border border-green-200"
                    } else if (isSelected) {
                      className += " bg-red-50 border border-red-200"
                    } else {
                      className += " bg-gray-50"
                    }

                    return (
                      <div key={optIndex} className={className}>
                        <span>({String.fromCharCode(65 + optIndex)}) {option}</span>
                        <span className="flex gap-2">
                          {isSelected && (
                            <span className={isCorrectOption ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              あなたの回答
                            </span>
                          )}
                          {isCorrectOption && (
                            <span className="text-green-600 font-medium">✓ 正解</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {question.explanation && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-700">解説</p>
                    <p className="text-sm text-blue-600 mt-1">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* アクションボタン */}
      <div className="flex gap-4 justify-center">
        <Link href={`/reading/${passageId}`}>
          <Button variant="outline">もう一度挑戦</Button>
        </Link>
        <Link href="/reading">
          <Button>次の問題へ</Button>
        </Link>
      </div>
    </div>
  )
}
