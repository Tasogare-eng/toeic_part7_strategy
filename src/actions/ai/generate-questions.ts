"use server"

import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient, getOpenAIModel, getMaxTokens } from "@/lib/openai/client"
import { handleOpenAIError } from "@/lib/openai/errors"
import { buildQuestionsPrompt, getSystemPromptForQuestions } from "@/lib/openai/prompts/questions"
import { requireAdmin } from "./admin"
import type { QuestionGenerationRequest, GeneratedQuestion, GenerationResult, AIMetadata } from "@/types/ai-generation"

export async function generateQuestions(
  request: QuestionGenerationRequest
): Promise<GenerationResult<GeneratedQuestion[]>> {
  // 管理者チェック
  const admin = await requireAdmin()
  if (!admin) {
    return { success: false, error: "管理者権限が必要です" }
  }

  try {
    const client = getOpenAIClient()
    const model = getOpenAIModel()
    const maxTokens = getMaxTokens()

    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: getSystemPromptForQuestions() },
        { role: "user", content: buildQuestionsPrompt(request) }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: "AIからの応答が空です" }
    }

    // AIがオブジェクトで返す場合に対応（{ questions: [...] } または直接配列）
    const parsed = JSON.parse(content)
    const questions: GeneratedQuestion[] = Array.isArray(parsed) ? parsed : parsed.questions

    if (!questions || !Array.isArray(questions)) {
      return { success: false, error: "設問の形式が不正です" }
    }

    const metadata: AIMetadata = {
      model,
      generatedAt: new Date().toISOString(),
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens
    }

    return {
      success: true,
      data: questions,
      metadata
    }
  } catch (error) {
    const handledError = handleOpenAIError(error)
    return { success: false, error: handledError.message }
  }
}

export async function saveGeneratedQuestions(
  passageId: string,
  questions: GeneratedQuestion[]
): Promise<{ success: boolean; questionIds?: string[]; error?: string }> {
  const admin = await requireAdmin()
  if (!admin) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const supabase = await createClient()

  const questionsToInsert = questions.map((q, index) => ({
    passage_id: passageId,
    question_text: q.questionText,
    question_type: q.questionType,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    order_index: index,
    is_ai_generated: true
  }))

  const { data, error } = await supabase
    .from("reading_questions")
    .insert(questionsToInsert)
    .select("id")

  if (error) {
    console.error("Error saving questions:", error)
    return { success: false, error: "設問の保存に失敗しました" }
  }

  return { success: true, questionIds: data.map(q => q.id) }
}
