"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  generateGrammarQuestions,
  saveGeneratedGrammarQuestions,
  type GeneratedGrammarQuestion,
} from "@/actions/ai/generate-grammar"
import type { GrammarCategory } from "@/types/grammar"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const GRAMMAR_CATEGORIES: { value: GrammarCategory; label: string }[] = [
  { value: "parts_of_speech", label: "品詞" },
  { value: "tense", label: "時制" },
  { value: "relative_clause", label: "関係詞" },
  { value: "conjunction", label: "接続詞" },
  { value: "preposition", label: "前置詞" },
  { value: "subjunctive", label: "仮定法" },
  { value: "passive", label: "受動態" },
  { value: "comparison", label: "比較" },
  { value: "article", label: "冠詞" },
  { value: "pronoun", label: "代名詞" },
]

const DIFFICULTIES = [
  { value: 1, label: "1 - 基礎" },
  { value: 2, label: "2 - 初中級" },
  { value: 3, label: "3 - 中級" },
  { value: 4, label: "4 - 上級" },
  { value: 5, label: "5 - 最上級" },
]

export function GrammarGenerator() {
  const [category, setCategory] = useState<GrammarCategory>("parts_of_speech")
  const [difficulty, setDifficulty] = useState(3)
  const [count, setCount] = useState(5)
  const [focusArea, setFocusArea] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedGrammarQuestion[] | null
  >(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)
    setGeneratedQuestions(null)

    try {
      const result = await generateGrammarQuestions({
        category,
        difficulty,
        count,
        focusArea: focusArea || undefined,
      })
      setGeneratedQuestions(result.questions)
      setMetadata(result.metadata)
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!generatedQuestions || !metadata) return

    setIsSaving(true)
    setError(null)
    try {
      await saveGeneratedGrammarQuestions(
        generatedQuestions,
        category,
        difficulty,
        metadata
      )
      setSuccessMessage(`${generatedQuestions.length}問を保存しました`)
      setGeneratedQuestions(null)
      setMetadata(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>文法問題生成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select
                value={category}
                onValueChange={(v: string) => setCategory(v as GrammarCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRAMMAR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>難易度</Label>
              <Select
                value={difficulty.toString()}
                onValueChange={(v: string) => setDifficulty(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>生成数</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>フォーカスエリア（任意）</Label>
              <Input
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder="例: 仮定法過去完了、関係代名詞which..."
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              "文法問題を生成"
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {generatedQuestions && (
        <Card>
          <CardHeader>
            <CardTitle>生成された問題 ({generatedQuestions.length}問)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedQuestions.map((q, index) => (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-lg space-y-3 border"
              >
                <p className="font-medium">
                  Q{index + 1}. {q.question_text}
                </p>
                <div className="space-y-1">
                  {q.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded text-sm ${
                        option.startsWith(q.correct_answer + ")")
                          ? "bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-700"
                          : "bg-background border"
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>解説:</strong> {q.explanation}
                  </p>
                  <p>
                    <strong>文法ポイント:</strong> {q.grammar_point}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "データベースに保存"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                再生成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
