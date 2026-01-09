"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Home,
} from "lucide-react"
import { FlashCard } from "./FlashCard"
import { recordVocabularyResult } from "@/actions/vocabulary"
import type { Vocabulary, VocabularyWithProgress } from "@/types/vocabulary"
import { LEVEL_LABELS } from "@/types/vocabulary"

interface FlashCardSessionProps {
  vocabularies: VocabularyWithProgress[]
  direction?: "en-to-ja" | "ja-to-en"
}

interface SessionResult {
  vocabulary: Vocabulary
  isCorrect: boolean
}

export function FlashCardSession({
  vocabularies,
  direction: initialDirection = "en-to-ja",
}: FlashCardSessionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<"en-to-ja" | "ja-to-en">(
    initialDirection
  )
  const [results, setResults] = useState<SessionResult[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentVocab = vocabularies[currentIndex]
  const progress = ((currentIndex + 1) / vocabularies.length) * 100

  const handleResult = async (isCorrect: boolean) => {
    // Record the result
    setResults((prev) => [...prev, { vocabulary: currentVocab, isCorrect }])

    // Save to database
    startTransition(async () => {
      try {
        await recordVocabularyResult(currentVocab.id, isCorrect)
      } catch (error) {
        console.error("Failed to record result:", error)
      }
    })

    // Move to next card or complete
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsComplete(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setResults([])
    setIsComplete(false)
  }

  const toggleDirection = () => {
    setDirection((prev) => (prev === "en-to-ja" ? "ja-to-en" : "en-to-ja"))
  }

  if (vocabularies.length === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">学習する単語がありません</p>
          <Button onClick={() => router.push("/vocabulary")}>
            単語一覧に戻る
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isComplete) {
    const correctCount = results.filter((r) => r.isCorrect).length
    const incorrectCount = results.length - correctCount
    const accuracy = Math.round((correctCount / results.length) * 100)

    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">セッション完了！</CardTitle>
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
              <p className="text-sm text-gray-500">覚えた</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{incorrectCount}</span>
              </div>
              <p className="text-sm text-gray-500">要復習</p>
            </div>
          </div>

          {incorrectCount > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">要復習の単語:</p>
              <div className="flex flex-wrap gap-2">
                {results
                  .filter((r) => !r.isCorrect)
                  .map((r) => (
                    <Badge key={r.vocabulary.id} variant="outline">
                      {r.vocabulary.word}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/vocabulary")}
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
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {currentIndex + 1} / {vocabularies.length}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {LEVEL_LABELS[currentVocab.level as 1 | 2 | 3 | 4]}
            </Badge>
            <Button variant="ghost" size="sm" onClick={toggleDirection}>
              {direction === "en-to-ja" ? "英→日" : "日→英"}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flash card */}
      <FlashCard
        key={currentVocab.id}
        vocabulary={currentVocab}
        direction={direction}
        onResult={handleResult}
      />

      {/* Navigation hint */}
      <p className="text-center text-sm text-gray-400">
        カードをタップして答えを確認
      </p>
    </div>
  )
}
