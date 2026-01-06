"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { generateQuestions, saveGeneratedQuestions } from "@/actions/ai/generate-questions"
import type { DocumentType } from "@/types/database"
import type { GeneratedQuestion, AIMetadata } from "@/types/ai-generation"

interface Props {
  passageId: string
  passageTitle: string
  passageContent: string
  documentType: DocumentType
}

const QUESTION_COUNTS = [3, 4, 5]

export function QuestionGenerator({ passageId, passageTitle, passageContent, documentType }: Props) {
  const router = useRouter()
  const [questionCount, setQuestionCount] = useState(4)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null)
  const [metadata, setMetadata] = useState<AIMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setGeneratedQuestions(null)

    const result = await generateQuestions({
      passageId,
      passageTitle,
      passageContent,
      documentType,
      questionCount,
    })

    setIsGenerating(false)

    if (!result.success) {
      setError(result.error || "生成に失敗しました")
      return
    }

    setGeneratedQuestions(result.data!)
    setMetadata(result.metadata!)
  }

  async function handleSave() {
    if (!generatedQuestions) return

    setIsSaving(true)
    const result = await saveGeneratedQuestions(passageId, generatedQuestions)
    setIsSaving(false)

    if (!result.success) {
      setError(result.error || "保存に失敗しました")
      return
    }

    // 完了後、問題ページへ遷移
    router.push(`/reading/${passageId}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 2: 設問生成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-medium">{passageTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">
              文書タイプ: {documentType}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">設問数</Label>
            <select
              id="questionCount"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full border rounded-md px-3 py-2"
            >
              {QUESTION_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}問
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "生成中..." : "設問を生成"}
          </Button>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      {generatedQuestions && (
        <Card>
          <CardHeader>
            <CardTitle>生成された設問 ({generatedQuestions.length}問)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedQuestions.map((q, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md space-y-3">
                <div className="flex items-start justify-between">
                  <p className="font-medium">Q{index + 1}. {q.questionText}</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {q.questionType}
                  </span>
                </div>

                <div className="space-y-1">
                  {q.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded text-sm ${
                        optIndex === q.correctAnswer
                          ? "bg-green-100 border border-green-300"
                          : "bg-white border"
                      }`}
                    >
                      ({String.fromCharCode(65 + optIndex)}) {option}
                      {optIndex === q.correctAnswer && (
                        <span className="ml-2 text-green-600 font-medium">正解</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">解説:</span> {q.explanation}
                </div>
              </div>
            ))}

            {metadata && (
              <div className="text-xs text-muted-foreground">
                モデル: {metadata.model} | トークン: {metadata.total_tokens}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存して完了"}
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                再生成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
