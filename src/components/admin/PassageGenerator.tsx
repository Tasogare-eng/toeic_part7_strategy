"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { generatePassage, saveGeneratedPassage } from "@/actions/ai/generate-passage"
import type { DocumentType } from "@/types/database"
import type { GeneratedPassage, AIMetadata } from "@/types/ai-generation"

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "article", label: "Article" },
  { value: "notice", label: "Notice" },
  { value: "advertisement", label: "Advertisement" },
  { value: "letter", label: "Letter" },
  { value: "chat", label: "Chat" },
  { value: "form", label: "Form" },
  { value: "review", label: "Review" },
]

const DIFFICULTIES = [
  { value: 1, label: "1 - 初級 (400-500点)" },
  { value: 2, label: "2 - 初中級 (500-600点)" },
  { value: 3, label: "3 - 中級 (600-700点)" },
  { value: 4, label: "4 - 中上級 (700-800点)" },
  { value: 5, label: "5 - 上級 (800-900点)" },
]

interface Props {
  onPassageGenerated: (passage: GeneratedPassage, passageId: string, metadata: AIMetadata) => void
}

export function PassageGenerator({ onPassageGenerated }: Props) {
  const [documentType, setDocumentType] = useState<DocumentType>("email")
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedPassage, setGeneratedPassage] = useState<GeneratedPassage | null>(null)
  const [metadata, setMetadata] = useState<AIMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setGeneratedPassage(null)

    const result = await generatePassage({
      documentType,
      difficulty,
      topic: topic || undefined,
    })

    setIsGenerating(false)

    if (!result.success) {
      setError(result.error || "生成に失敗しました")
      return
    }

    setGeneratedPassage(result.data!)
    setMetadata(result.metadata!)
  }

  async function handleSave() {
    if (!generatedPassage || !metadata) return

    setIsSaving(true)
    const result = await saveGeneratedPassage(generatedPassage, metadata)
    setIsSaving(false)

    if (!result.success) {
      setError(result.error || "保存に失敗しました")
      return
    }

    onPassageGenerated(generatedPassage, result.passageId!, metadata)
    setGeneratedPassage(null)
    setMetadata(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: パッセージ生成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">文書タイプ</Label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full border rounded-md px-3 py-2"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">難易度</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full border rounded-md px-3 py-2"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">トピック（任意）</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例: 会議の日程変更、新製品発表、採用面接..."
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "生成中..." : "パッセージを生成"}
          </Button>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      {generatedPassage && (
        <Card>
          <CardHeader>
            <CardTitle>生成されたパッセージ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>タイトル</Label>
              <p className="font-medium">{generatedPassage.title}</p>
            </div>

            <div className="space-y-2">
              <Label>本文</Label>
              <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-md">
                {generatedPassage.content}
              </pre>
            </div>

            {metadata && (
              <div className="text-xs text-muted-foreground">
                モデル: {metadata.model} | トークン: {metadata.total_tokens}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存して設問生成へ"}
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
