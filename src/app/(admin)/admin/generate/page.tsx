"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PassageGenerator } from "@/components/admin/PassageGenerator"
import { QuestionGenerator } from "@/components/admin/QuestionGenerator"
import { GrammarGenerator } from "@/components/admin/GrammarGenerator"
import { VocabularyGenerator } from "@/components/admin/VocabularyGenerator"
import type { DocumentType } from "@/types/database"
import type { GeneratedPassage, AIMetadata } from "@/types/ai-generation"

interface SavedPassage {
  passage: GeneratedPassage
  passageId: string
  metadata: AIMetadata
}

export default function GeneratePage() {
  const [savedPassage, setSavedPassage] = useState<SavedPassage | null>(null)
  const [activeTab, setActiveTab] = useState("passage")

  function handlePassageGenerated(
    passage: GeneratedPassage,
    passageId: string,
    metadata: AIMetadata
  ) {
    setSavedPassage({ passage, passageId, metadata })
  }

  function handleReset() {
    setSavedPassage(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI問題生成</h1>
        {savedPassage && activeTab === "passage" && (
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            最初からやり直す
          </button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="passage">長文読解</TabsTrigger>
          <TabsTrigger value="grammar">文法問題</TabsTrigger>
          <TabsTrigger value="vocabulary">単語</TabsTrigger>
        </TabsList>

        <TabsContent value="passage" className="mt-6">
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
        </TabsContent>

        <TabsContent value="grammar" className="mt-6">
          <GrammarGenerator />
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-6">
          <VocabularyGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
