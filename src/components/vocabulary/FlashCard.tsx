"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Volume2, RotateCcw } from "lucide-react"
import type { Vocabulary } from "@/types/vocabulary"
import { PART_OF_SPEECH_LABELS } from "@/types/vocabulary"

interface FlashCardProps {
  vocabulary: Vocabulary
  direction: "en-to-ja" | "ja-to-en"
  onResult: (isCorrect: boolean) => void
  showResult?: boolean
}

export function FlashCard({
  vocabulary,
  direction,
  onResult,
  showResult = true,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const front = direction === "en-to-ja" ? vocabulary.word : vocabulary.meaning
  const back = direction === "en-to-ja" ? vocabulary.meaning : vocabulary.word

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleResult = (isCorrect: boolean) => {
    onResult(isCorrect)
    setIsFlipped(false)
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className="relative h-72 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <Card
          className={`
            absolute inset-0 w-full h-full
            transition-all duration-500 transform-style-preserve-3d
            ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
          `}
        >
          {/* Front side */}
          <div
            className={`
              absolute inset-0 w-full h-full backface-hidden
              flex flex-col items-center justify-center p-6
              ${isFlipped ? "invisible" : ""}
            `}
          >
            <p className="text-3xl font-bold text-center">{front}</p>
            {direction === "en-to-ja" && vocabulary.pronunciation && (
              <p className="text-gray-500 mt-2 text-lg">{vocabulary.pronunciation}</p>
            )}
            {vocabulary.part_of_speech && (
              <Badge variant="secondary" className="mt-3">
                {PART_OF_SPEECH_LABELS[vocabulary.part_of_speech]}
              </Badge>
            )}
            <p className="text-sm text-gray-400 mt-6">タップして答えを確認</p>
          </div>

          {/* Back side */}
          <div
            className={`
              absolute inset-0 w-full h-full backface-hidden [transform:rotateY(180deg)]
              flex flex-col items-center justify-center p-6
              ${!isFlipped ? "invisible" : ""}
            `}
          >
            <p className="text-2xl font-bold text-center">{back}</p>
            {direction === "ja-to-en" && vocabulary.pronunciation && (
              <p className="text-gray-500 mt-2">{vocabulary.pronunciation}</p>
            )}
            {vocabulary.example_sentence && (
              <div className="mt-4 text-sm text-center max-w-md">
                <p className="text-gray-700 italic">{vocabulary.example_sentence}</p>
                {vocabulary.example_translation && (
                  <p className="text-gray-500 mt-1">
                    {vocabulary.example_translation}
                  </p>
                )}
              </div>
            )}
            {vocabulary.synonyms && vocabulary.synonyms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                {vocabulary.synonyms.map((syn, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {syn}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Result buttons - shown when flipped */}
      {isFlipped && showResult && (
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="lg"
            className="text-red-500 border-red-300 hover:bg-red-50 hover:border-red-500"
            onClick={(e) => {
              e.stopPropagation()
              handleResult(false)
            }}
          >
            <X className="mr-2 h-5 w-5" />
            わからなかった
          </Button>
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={(e) => {
              e.stopPropagation()
              handleResult(true)
            }}
          >
            <Check className="mr-2 h-5 w-5" />
            覚えた
          </Button>
        </div>
      )}
    </div>
  )
}
