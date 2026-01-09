"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Volume2 } from "lucide-react"
import type { VocabularyWithProgress } from "@/types/vocabulary"
import {
  LEVEL_LABELS,
  CATEGORY_LABELS,
  PART_OF_SPEECH_LABELS,
  VocabularyLevel,
  VocabularyCategory,
  PartOfSpeech,
} from "@/types/vocabulary"
import { BookmarkButton } from "@/components/common/BookmarkButton"

interface VocabularyListProps {
  vocabularies: VocabularyWithProgress[]
}

export function VocabularyList({ vocabularies }: VocabularyListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (vocabularies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        単語が見つかりません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {vocabularies.map((vocab) => {
        const isExpanded = expandedId === vocab.id
        const progress = vocab.vocabulary_progress?.[0]
        const familiarity = progress?.familiarity || 0

        return (
          <Card
            key={vocab.id}
            className={`
              overflow-hidden transition-all cursor-pointer
              ${isExpanded ? "ring-2 ring-blue-500" : "hover:bg-gray-50"}
            `}
          >
            <div
              className="p-4"
              onClick={() => toggleExpand(vocab.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg truncate">{vocab.word}</p>
                    {vocab.pronunciation && (
                      <span className="text-sm text-gray-400 hidden sm:inline">
                        {vocab.pronunciation}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 truncate">{vocab.meaning}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {LEVEL_LABELS[vocab.level as VocabularyLevel]}
                    </Badge>
                    {vocab.category && (
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[vocab.category as VocabularyCategory]}
                      </Badge>
                    )}
                  </div>
                  <div className="w-16">
                    <Progress
                      value={(familiarity / 5) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-center text-gray-400 mt-0.5">
                      {familiarity}/5
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t bg-gray-50">
                <div className="pt-4 space-y-3">
                  {/* Details */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {LEVEL_LABELS[vocab.level as VocabularyLevel]}
                    </Badge>
                    {vocab.category && (
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[vocab.category as VocabularyCategory]}
                      </Badge>
                    )}
                    {vocab.part_of_speech && (
                      <Badge variant="outline">
                        {PART_OF_SPEECH_LABELS[vocab.part_of_speech as PartOfSpeech]}
                      </Badge>
                    )}
                  </div>

                  {/* Example sentence */}
                  {vocab.example_sentence && (
                    <div className="text-sm">
                      <p className="text-gray-700">{vocab.example_sentence}</p>
                      {vocab.example_translation && (
                        <p className="text-gray-500 mt-1">
                          {vocab.example_translation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms */}
                  {vocab.synonyms && vocab.synonyms.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">類義語:</span>
                      <div className="flex flex-wrap gap-1">
                        {vocab.synonyms.map((syn, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {syn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress info */}
                  {progress && (
                    <div className="text-xs text-gray-500 flex items-center gap-4">
                      <span>正解: {progress.correct_count}回</span>
                      <span>不正解: {progress.incorrect_count}回</span>
                      {progress.next_review_at && (
                        <span>
                          次回復習:{" "}
                          {new Date(progress.next_review_at).toLocaleDateString(
                            "ja-JP"
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end pt-2">
                    <BookmarkButton
                      itemType="vocabulary"
                      itemId={vocab.id}
                      isBookmarked={false}
                      showLabel
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
