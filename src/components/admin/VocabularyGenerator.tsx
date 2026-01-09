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
  generateVocabulary,
  saveGeneratedVocabulary,
  type GeneratedVocabulary,
} from "@/actions/ai/generate-vocabulary"
import type { VocabularyLevel, VocabularyCategory } from "@/types/vocabulary"
import { Loader2, CheckCircle2, AlertCircle, Volume2 } from "lucide-react"

const VOCABULARY_LEVELS: { value: VocabularyLevel; label: string }[] = [
  { value: 1, label: "600点レベル" },
  { value: 2, label: "700点レベル" },
  { value: 3, label: "800点レベル" },
  { value: 4, label: "900点レベル" },
]

const VOCABULARY_CATEGORIES: { value: VocabularyCategory; label: string }[] = [
  { value: "business", label: "ビジネス一般" },
  { value: "finance", label: "金融・会計" },
  { value: "marketing", label: "マーケティング" },
  { value: "hr", label: "人事・採用" },
  { value: "technology", label: "IT・テクノロジー" },
  { value: "travel", label: "出張・旅行" },
  { value: "general", label: "一般" },
]

export function VocabularyGenerator() {
  const [level, setLevel] = useState<VocabularyLevel>(2)
  const [category, setCategory] = useState<VocabularyCategory>("business")
  const [count, setCount] = useState(10)
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedVocabulary, setGeneratedVocabulary] = useState<
    GeneratedVocabulary[] | null
  >(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)
    setGeneratedVocabulary(null)

    try {
      const result = await generateVocabulary({
        level,
        category,
        count,
        topic: topic || undefined,
      })
      setGeneratedVocabulary(result.vocabularies)
      setMetadata(result.metadata)
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!generatedVocabulary || !metadata) return

    setIsSaving(true)
    setError(null)
    try {
      await saveGeneratedVocabulary(generatedVocabulary, level, category, metadata)
      setSuccessMessage(`${generatedVocabulary.length}語を保存しました`)
      setGeneratedVocabulary(null)
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
          <CardTitle>単語生成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>レベル</Label>
              <Select
                value={level.toString()}
                onValueChange={(v: string) => setLevel(parseInt(v) as VocabularyLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOCABULARY_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value.toString()}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select
                value={category}
                onValueChange={(v: string) => setCategory(v as VocabularyCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOCABULARY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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
                max={20}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>トピック（任意）</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例: 会議、プレゼンテーション..."
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
              "単語を生成"
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

      {generatedVocabulary && (
        <Card>
          <CardHeader>
            <CardTitle>生成された単語 ({generatedVocabulary.length}語)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedVocabulary.map((vocab, index) => (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-lg space-y-2 border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{vocab.word}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Volume2 className="h-3 w-3" />
                      <span>{vocab.pronunciation}</span>
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {vocab.part_of_speech}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-medium">{vocab.meaning}</span>
                </div>
                <div className="text-sm space-y-1 pt-2 border-t">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">例文:</span>{" "}
                    {vocab.example_sentence}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">訳:</span>{" "}
                    {vocab.example_translation}
                  </p>
                  {vocab.synonyms && vocab.synonyms.length > 0 && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">類義語:</span>{" "}
                      {vocab.synonyms.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4">
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
