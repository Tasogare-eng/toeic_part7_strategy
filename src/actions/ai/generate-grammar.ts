"use server"

import { createOpenAIClient, handleOpenAIError } from "@/lib/openai/client"
import { requireAdmin } from "./admin"
import { createClient } from "@/lib/supabase/server"
import type { GrammarCategory } from "@/types/grammar"

export interface GrammarGenerationRequest {
  category: GrammarCategory
  difficulty: number
  count: number
  focusArea?: string
}

export interface GeneratedGrammarQuestion {
  question_text: string
  options: string[]
  correct_answer: "A" | "B" | "C" | "D"
  explanation: string
  grammar_point: string
}

const CATEGORY_DESCRIPTIONS: Record<GrammarCategory, string> = {
  parts_of_speech: "品詞問題（名詞、動詞、形容詞、副詞の使い分け）",
  tense: "時制問題（現在、過去、未来、完了形）",
  relative_clause: "関係詞問題（which, who, that, whose等）",
  conjunction: "接続詞問題（and, but, because, although等）",
  preposition: "前置詞問題（at, in, on, for, to等）",
  subjunctive: "仮定法問題（if, wish, as if等）",
  passive: "受動態問題",
  comparison: "比較問題（比較級、最上級、as...as）",
  article: "冠詞問題（a, an, the）",
  pronoun: "代名詞問題",
}

const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: "基礎レベル - 基本的な文法規則",
  2: "初中級レベル - 一般的な文法パターン",
  3: "中級レベル - やや複雑な文法構造",
  4: "上級レベル - 複雑な文法と例外",
  5: "最上級レベル - 高度な文法知識が必要",
}

export async function generateGrammarQuestions(
  request: GrammarGenerationRequest
) {
  await requireAdmin()

  const openai = createOpenAIClient()

  const prompt = `
Generate ${request.count} TOEIC Part 5/6 style grammar questions for:
- Category: ${CATEGORY_DESCRIPTIONS[request.category]}
- Difficulty: ${request.difficulty}/5 - ${DIFFICULTY_DESCRIPTIONS[request.difficulty]}
${request.focusArea ? `- Focus area: ${request.focusArea}` : ""}

Return a JSON object with this structure:
{
  "questions": [
    {
      "question_text": "The manager ------- the meeting due to the unexpected circumstances.",
      "options": ["A) postpone", "B) postponed", "C) postponing", "D) has postpone"],
      "correct_answer": "B",
      "explanation": "過去の出来事を表すため、過去形「postponed」が正解です。文中の「unexpected circumstances」は過去に起きた状況を示しています。",
      "grammar_point": "時制の一致：過去の出来事には過去形を使用します。動詞の時制は文脈から判断することが重要です。"
    }
  ]
}

Requirements:
- Questions should match TOEIC Part 5 format exactly
- Use realistic business/workplace contexts
- The blank (-------) should always be 7 dashes
- Options must start with A), B), C), D) followed by a space
- Provide detailed Japanese explanations
- Include a grammar point summary for each question
- All 4 options should be plausible and test the specific grammar point
- Options should be grammatically similar to the correct answer
- Do not make the correct answer obvious from length or structure
- Vary which letter is the correct answer (don't always make it B or C)
`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an expert TOEIC grammar question writer with extensive experience creating Part 5 and Part 6 questions. Generate questions that accurately test the specified grammar point at the appropriate difficulty level.",
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

    return {
      questions: parsed.questions as GeneratedGrammarQuestion[],
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

export async function saveGeneratedGrammarQuestions(
  questions: GeneratedGrammarQuestion[],
  category: GrammarCategory,
  difficulty: number,
  metadata: Record<string, unknown>
) {
  await requireAdmin()

  const supabase = await createClient()

  const records = questions.map((q) => ({
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    category,
    difficulty,
    grammar_point: q.grammar_point,
    is_ai_generated: true,
    ai_metadata: metadata,
  }))

  const { data, error } = await supabase
    .from("grammar_questions")
    .insert(records)
    .select()

  if (error) throw error
  return data
}
