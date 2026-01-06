"use server"

import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient, getOpenAIModel, getMaxTokens } from "@/lib/openai/client"
import { handleOpenAIError } from "@/lib/openai/errors"
import { buildPassagePrompt, getSystemPromptForPassage } from "@/lib/openai/prompts/passage"
import { requireAdmin } from "./admin"
import type { PassageGenerationRequest, GeneratedPassage, GenerationResult, AIMetadata } from "@/types/ai-generation"

export async function generatePassage(
  request: PassageGenerationRequest
): Promise<GenerationResult<GeneratedPassage>> {
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
        { role: "system", content: getSystemPromptForPassage() },
        { role: "user", content: buildPassagePrompt(request) }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: "AIからの応答が空です" }
    }

    const parsed = JSON.parse(content) as { title: string; content: string }

    const metadata: AIMetadata = {
      model,
      generatedAt: new Date().toISOString(),
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens
    }

    const generatedPassage: GeneratedPassage = {
      title: parsed.title,
      content: parsed.content,
      documentType: request.documentType,
      difficulty: request.difficulty
    }

    return {
      success: true,
      data: generatedPassage,
      metadata
    }
  } catch (error) {
    const handledError = handleOpenAIError(error)
    return { success: false, error: handledError.message }
  }
}

export async function saveGeneratedPassage(
  passage: GeneratedPassage,
  metadata: AIMetadata
): Promise<{ success: boolean; passageId?: string; error?: string }> {
  const admin = await requireAdmin()
  if (!admin) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reading_passages")
    .insert({
      title: passage.title,
      content: passage.content,
      document_type: passage.documentType,
      difficulty: passage.difficulty,
      is_ai_generated: true,
      ai_metadata: metadata
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error saving passage:", error)
    return { success: false, error: "パッセージの保存に失敗しました" }
  }

  return { success: true, passageId: data.id }
}
