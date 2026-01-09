"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { GrammarQuestion, GrammarCategory } from "@/types/grammar"

interface GetGrammarQuestionsOptions {
  category?: GrammarCategory
  difficulty?: number
  limit?: number
  offset?: number
}

// 文法問題一覧取得
export async function getGrammarQuestions(
  options?: GetGrammarQuestionsOptions
): Promise<GrammarQuestion[]> {
  const supabase = await createClient()

  let query = supabase.from("grammar_questions").select("*")

  if (options?.category) {
    query = query.eq("category", options.category)
  }
  if (options?.difficulty) {
    query = query.eq("difficulty", options.difficulty)
  }

  query = query.order("created_at", { ascending: false })

  if (options?.limit) {
    const offset = options.offset || 0
    query = query.range(offset, offset + options.limit - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// 文法問題の総数を取得
export async function getGrammarQuestionCount(options?: {
  category?: GrammarCategory
  difficulty?: number
}): Promise<number> {
  const supabase = await createClient()

  let query = supabase
    .from("grammar_questions")
    .select("*", { count: "exact", head: true })

  if (options?.category) {
    query = query.eq("category", options.category)
  }
  if (options?.difficulty) {
    query = query.eq("difficulty", options.difficulty)
  }

  const { count, error } = await query

  if (error) throw error
  return count || 0
}

// ランダムな文法問題を取得（練習モード用）
export async function getRandomGrammarQuestions(
  count: number = 10,
  options?: {
    category?: GrammarCategory
    difficulty?: number
  }
): Promise<GrammarQuestion[]> {
  const supabase = await createClient()

  let query = supabase.from("grammar_questions").select("*")

  if (options?.category) {
    query = query.eq("category", options.category)
  }
  if (options?.difficulty) {
    query = query.eq("difficulty", options.difficulty)
  }

  const { data, error } = await query

  if (error) throw error

  // シャッフルして指定数を返す
  const shuffled = (data || []).sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// 文法問題の回答を送信
export async function submitGrammarAnswer(
  questionId: string,
  selectedAnswer: string,
  timeSpentSeconds?: number
): Promise<{ isCorrect: boolean; correctAnswer: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  // 正解を取得
  const { data: question } = await supabase
    .from("grammar_questions")
    .select("correct_answer")
    .eq("id", questionId)
    .single()

  if (!question) throw new Error("問題が見つかりません")

  const isCorrect = question.correct_answer === selectedAnswer

  const { error } = await supabase.from("grammar_answers").insert({
    user_id: user.id,
    question_id: questionId,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
    time_spent_seconds: timeSpentSeconds,
  })

  if (error) throw error

  // Note: revalidatePath is not called here to prevent page re-render during practice session
  // The grammar page will be revalidated when the user navigates back

  return { isCorrect, correctAnswer: question.correct_answer }
}

// 文法カテゴリ別の統計を取得
export async function getGrammarStatsByCategory(): Promise<
  Array<{
    category: GrammarCategory
    total_answers: number
    correct_count: number
    accuracy: number
  }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("grammar_stats_by_category")
    .select("*")
    .eq("user_id", user.id)

  if (error) throw error
  return data || []
}

// 間違えた文法問題を取得
export async function getIncorrectGrammarQuestions(
  limit: number = 20
): Promise<GrammarQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // 最近間違えた問題を取得
  const { data, error } = await supabase
    .from("grammar_answers")
    .select(
      `
      question_id,
      grammar_questions(*)
    `
    )
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .order("answered_at", { ascending: false })
    .limit(limit * 2) // 重複を考慮して多めに取得

  if (error) throw error

  // 重複を除去して問題を返す
  const uniqueQuestions = new Map<string, GrammarQuestion>()
  data?.forEach((item) => {
    if (
      item.grammar_questions &&
      !uniqueQuestions.has(item.question_id)
    ) {
      uniqueQuestions.set(
        item.question_id,
        item.grammar_questions as unknown as GrammarQuestion
      )
    }
  })

  return Array.from(uniqueQuestions.values()).slice(0, limit)
}

// 文法統計を取得
export async function getGrammarStats(): Promise<{
  totalQuestions: number
  totalAnswered: number
  accuracy: number
  averageTime: number
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { count: totalQuestions } = await supabase
    .from("grammar_questions")
    .select("*", { count: "exact", head: true })

  const { data: answers } = await supabase
    .from("grammar_answers")
    .select("is_correct, time_spent_seconds")
    .eq("user_id", user.id)

  if (!answers || answers.length === 0) {
    return {
      totalQuestions: totalQuestions || 0,
      totalAnswered: 0,
      accuracy: 0,
      averageTime: 0,
    }
  }

  const correctCount = answers.filter((a) => a.is_correct).length
  const timesWithValue = answers.filter((a) => a.time_spent_seconds !== null)
  const totalTime = timesWithValue.reduce(
    (sum, a) => sum + (a.time_spent_seconds || 0),
    0
  )

  return {
    totalQuestions: totalQuestions || 0,
    totalAnswered: answers.length,
    accuracy: Math.round((correctCount / answers.length) * 100),
    averageTime:
      timesWithValue.length > 0
        ? Math.round(totalTime / timesWithValue.length)
        : 0,
  }
}

// 単一の文法問題を取得
export async function getGrammarQuestion(
  questionId: string
): Promise<GrammarQuestion | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("grammar_questions")
    .select("*")
    .eq("id", questionId)
    .single()

  if (error) return null
  return data
}
