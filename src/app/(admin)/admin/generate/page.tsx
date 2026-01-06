"use client"

import { useState } from "react"
import { PassageGenerator } from "@/components/admin/PassageGenerator"
import { QuestionGenerator } from "@/components/admin/QuestionGenerator"
import type { DocumentType } from "@/types/database"
import type { GeneratedPassage, AIMetadata } from "@/types/ai-generation"

interface SavedPassage {
  passage: GeneratedPassage
  passageId: string
  metadata: AIMetadata
}

export default function GeneratePage() {
  const [savedPassage, setSavedPassage] = useState<SavedPassage | null>(null)

  function handlePassageGenerated(passage: GeneratedPassage, passageId: string, metadata: AIMetadata) {
    setSavedPassage({ passage, passageId, metadata })
  }

  function handleReset() {
    setSavedPassage(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI問題生成</h1>
        {savedPassage && (
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            最初からやり直す
          </button>
        )}
      </div>

      {!savedPassage ? (
        <PassageGenerator onPassageGenerated={handlePassageGenerated} />
      ) : (
        <QuestionGenerator
          passageId={savedPassage.passageId}
          passageTitle={savedPassage.passage.title}
          passageContent={savedPassage.passage.content}
          documentType={savedPassage.passage.documentType as DocumentType}
        />
      )}
    </div>
  )
}
