"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  Vocabulary,
  VocabularyWithProgress,
  VocabularyLevel,
  VocabularyCategory,
} from "@/types/vocabulary"
import { DEFAULT_SPACED_REPETITION_CONFIG } from "@/types/review"

interface GetVocabularyOptions {
  level?: VocabularyLevel
  category?: VocabularyCategory
  limit?: number
  offset?: number
}

// 単語一覧取得
export async function getVocabulary(
  options?: GetVocabularyOptions
): Promise<VocabularyWithProgress[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase.from("vocabulary").select(`
      *,
      vocabulary_progress!left(*)
    `)

  if (options?.level) {
    query = query.eq("level", options.level)
  }
  if (options?.category) {
    query = query.eq("category", options.category)
  }

  query = query
    .order("level", { ascending: true })
    .order("word", { ascending: true })

  if (options?.limit) {
    const offset = options.offset || 0
    query = query.range(offset, offset + options.limit - 1)
  }

  const { data, error } = await query

  if (error) throw error

  // ユーザーの進捗のみをフィルタリング
  return (data || []).map((vocab) => ({
    ...vocab,
    vocabulary_progress: user
      ? vocab.vocabulary_progress?.filter(
          (p: { user_id: string }) => p.user_id === user.id
        ) || null
      : null,
  }))
}

// 単語の総数を取得
export async function getVocabularyCount(options?: {
  level?: VocabularyLevel
  category?: VocabularyCategory
}): Promise<number> {
  const supabase = await createClient()

  let query = supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })

  if (options?.level) {
    query = query.eq("level", options.level)
  }
  if (options?.category) {
    query = query.eq("category", options.category)
  }

  const { count, error } = await query

  if (error) throw error
  return count || 0
}

// 今日の復習単語を取得
export async function getTodayReviewVocabulary(): Promise<
  VocabularyWithProgress[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("vocabulary_progress")
    .select(
      `
      *,
      vocabulary(*)
    `
    )
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(20)

  if (error) throw error

  // vocabulary_progressの構造をVocabularyWithProgressに変換
  return (data || []).map((item) => ({
    ...item.vocabulary,
    vocabulary_progress: [
      {
        id: item.id,
        user_id: item.user_id,
        vocabulary_id: item.vocabulary_id,
        familiarity: item.familiarity,
        correct_count: item.correct_count,
        incorrect_count: item.incorrect_count,
        last_reviewed_at: item.last_reviewed_at,
        next_review_at: item.next_review_at,
        review_interval_days: item.review_interval_days,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    ],
  }))
}

// 未学習の単語を取得
export async function getUnlearnedVocabulary(
  options?: GetVocabularyOptions
): Promise<Vocabulary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // まず学習済みの単語IDを取得
  const { data: progressData } = await supabase
    .from("vocabulary_progress")
    .select("vocabulary_id")
    .eq("user_id", user.id)

  const learnedIds = (progressData || []).map((p) => p.vocabulary_id)

  // 学習済みでない単語を取得
  let query = supabase.from("vocabulary").select("*")

  if (learnedIds.length > 0) {
    query = query.not("id", "in", `(${learnedIds.join(",")})`)
  }

  if (options?.level) {
    query = query.eq("level", options.level)
  }
  if (options?.category) {
    query = query.eq("category", options.category)
  }

  query = query
    .order("level", { ascending: true })
    .order("word", { ascending: true })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// 単語学習結果を記録
export async function recordVocabularyResult(
  vocabularyId: string,
  isCorrect: boolean
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const config = DEFAULT_SPACED_REPETITION_CONFIG

  // 既存の進捗を取得
  const { data: existing } = await supabase
    .from("vocabulary_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabularyId)
    .single()

  const now = new Date()
  let newFamiliarity: number
  let newInterval: number

  if (existing) {
    // 既存の進捗を更新
    if (isCorrect) {
      newFamiliarity = Math.min(existing.familiarity + 1, 5)
      newInterval = Math.min(
        existing.review_interval_days * config.correctMultiplier,
        config.maxInterval
      )
    } else {
      newFamiliarity = Math.max(existing.familiarity - 1, 0)
      newInterval = config.incorrectInterval
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + Math.round(newInterval))

    const { error } = await supabase
      .from("vocabulary_progress")
      .update({
        familiarity: newFamiliarity,
        correct_count: existing.correct_count + (isCorrect ? 1 : 0),
        incorrect_count: existing.incorrect_count + (isCorrect ? 0 : 1),
        last_reviewed_at: now.toISOString(),
        next_review_at: nextReview.toISOString(),
        review_interval_days: Math.round(newInterval),
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id)

    if (error) throw error
  } else {
    // 新規作成
    newFamiliarity = isCorrect ? 1 : 0
    newInterval = isCorrect ? 3 : 1

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + newInterval)

    const { error } = await supabase.from("vocabulary_progress").insert({
      user_id: user.id,
      vocabulary_id: vocabularyId,
      familiarity: newFamiliarity,
      correct_count: isCorrect ? 1 : 0,
      incorrect_count: isCorrect ? 0 : 1,
      last_reviewed_at: now.toISOString(),
      next_review_at: nextReview.toISOString(),
      review_interval_days: newInterval,
    })

    if (error) throw error
  }

  // Note: revalidatePath is not called here to prevent re-shuffling during flashcard session
  // The vocabulary page will be revalidated when the user navigates back
}

// 単語統計を取得
export async function getVocabularyStats(): Promise<{
  totalWords: number
  learned: number
  mastered: number
  accuracy: number
  reviewDue: number
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: progress } = await supabase
    .from("vocabulary_progress")
    .select("familiarity, correct_count, incorrect_count, next_review_at")
    .eq("user_id", user.id)

  const { count: totalWords } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })

  if (!progress) return null

  const now = new Date()
  const learned = progress.filter((p) => p.familiarity >= 1).length
  const mastered = progress.filter((p) => p.familiarity >= 4).length
  const totalCorrect = progress.reduce((sum, p) => sum + p.correct_count, 0)
  const totalIncorrect = progress.reduce((sum, p) => sum + p.incorrect_count, 0)
  const totalAttempts = totalCorrect + totalIncorrect
  const reviewDue = progress.filter(
    (p) => p.next_review_at && new Date(p.next_review_at) <= now
  ).length

  return {
    totalWords: totalWords || 0,
    learned,
    mastered,
    accuracy:
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    reviewDue,
  }
}

// レベル別統計を取得
export async function getVocabularyStatsByLevel(): Promise<
  Array<{
    level: number
    total_words: number
    learned_count: number
    mastered_count: number
    avg_familiarity: number
  }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("vocabulary_stats_by_level")
    .select("*")
    .eq("user_id", user.id)
    .order("level", { ascending: true })

  if (error) throw error
  return data || []
}
