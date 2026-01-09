"use server"

import { createOpenAIClient, handleOpenAIError } from "@/lib/openai/client"
import { requireAdmin } from "./admin"
import { createClient } from "@/lib/supabase/server"
import type { VocabularyLevel, VocabularyCategory } from "@/types/vocabulary"

export interface VocabularyGenerationRequest {
  level: VocabularyLevel
  category: VocabularyCategory
  count: number
  topic?: string
}

export interface GeneratedVocabulary {
  word: string
  meaning: string
  pronunciation: string
  part_of_speech: string
  example_sentence: string
  example_translation: string
  synonyms: string[]
}

const LEVEL_DESCRIPTIONS: Record<VocabularyLevel, string> = {
  1: "TOEIC 600点レベル（基礎的なビジネス英語）",
  2: "TOEIC 700点レベル（中級ビジネス英語）",
  3: "TOEIC 800点レベル（上級ビジネス英語）",
  4: "TOEIC 900点レベル（高度なビジネス英語）",
}

const CATEGORY_DESCRIPTIONS: Record<VocabularyCategory, string> = {
  business: "一般的なビジネス用語",
  finance: "金融・会計関連",
  marketing: "マーケティング・広告関連",
  hr: "人事・採用関連",
  technology: "IT・テクノロジー関連",
  travel: "出張・旅行関連",
  general: "一般的な語彙",
}

export async function generateVocabulary(request: VocabularyGenerationRequest) {
  await requireAdmin()

  const openai = createOpenAIClient()

  const prompt = `
Generate ${request.count} TOEIC vocabulary words for the following criteria:
- Level: ${LEVEL_DESCRIPTIONS[request.level]}
- Category: ${CATEGORY_DESCRIPTIONS[request.category]}
${request.topic ? `- Topic focus: ${request.topic}` : ""}

Return a JSON object with the following structure:
{
  "vocabularies": [
    {
      "word": "negotiate",
      "meaning": "交渉する",
      "pronunciation": "/nɪˈɡoʊʃieɪt/",
      "part_of_speech": "verb",
      "example_sentence": "The sales team will negotiate the contract terms with the client.",
      "example_translation": "営業チームはクライアントと契約条件を交渉します。",
      "synonyms": ["bargain", "discuss", "deal"]
    }
  ]
}

Requirements:
- Words should be commonly used in TOEIC Part 7 reading passages
- Examples should be in business context appropriate for the category
- Provide accurate Japanese translations
- Include IPA pronunciation
- Include 2-3 synonyms for each word
- Part of speech should be one of: noun, verb, adjective, adverb, preposition, conjunction
- Do not include duplicate words
`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an expert TOEIC vocabulary teacher specializing in business English. Generate vocabulary appropriate for the specified TOEIC level and category.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error("No content in response")

    const parsed = JSON.parse(content)
    const vocabularies = parsed.vocabularies || []

    return {
      vocabularies: vocabularies as GeneratedVocabulary[],
      metadata: {
        model: response.model,
        generatedAt: new Date().toISOString(),
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    }
  } catch (error) {
    throw handleOpenAIError(error)
  }
}

export async function saveGeneratedVocabulary(
  vocabularies: GeneratedVocabulary[],
  level: VocabularyLevel,
  category: VocabularyCategory,
  metadata: Record<string, unknown>
) {
  await requireAdmin()

  const supabase = await createClient()

  const records = vocabularies.map((vocab) => ({
    word: vocab.word,
    meaning: vocab.meaning,
    pronunciation: vocab.pronunciation,
    part_of_speech: vocab.part_of_speech,
    level,
    example_sentence: vocab.example_sentence,
    example_translation: vocab.example_translation,
    category,
    synonyms: vocab.synonyms,
    is_ai_generated: true,
    ai_metadata: metadata,
  }))

  const { data, error } = await supabase
    .from("vocabulary")
    .insert(records)
    .select()

  if (error) throw error
  return data
}
