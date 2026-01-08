"use server"

import { createClient } from "@/lib/supabase/server"

export interface DailyStats {
  date: string
  questions_answered: number
  correct_count: number
  accuracy: number
  total_time_seconds: number
}

export interface CategoryStats {
  name: string
  questions_answered: number
  correct_count: number
  accuracy: number
}

export interface WeakAreas {
  documentTypes: Array<{ document_type: string; accuracy: number; questions_answered: number }>
  questionTypes: Array<{ question_type: string; accuracy: number; questions_answered: number }>
}

// 日別正答率の取得（グラフ用）
export async function getDailyAccuracy(days: number = 30): Promise<DailyStats[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from("daily_user_stats")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true })

  if (error) {
    console.error("Error fetching daily accuracy:", error)
    return []
  }

  return data ?? []
}

// 文書タイプ別正答率
export async function getAccuracyByDocumentType(): Promise<CategoryStats[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("user_stats_by_document_type")
    .select("*")
    .eq("user_id", user.id)

  if (error) {
    console.error("Error fetching document type stats:", error)
    return []
  }

  return (data ?? []).map(d => ({
    name: d.document_type,
    questions_answered: d.questions_answered,
    correct_count: d.correct_count,
    accuracy: d.accuracy
  }))
}

// 設問タイプ別正答率
export async function getAccuracyByQuestionType(): Promise<CategoryStats[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("user_stats_by_question_type")
    .select("*")
    .eq("user_id", user.id)

  if (error) {
    console.error("Error fetching question type stats:", error)
    return []
  }

  return (data ?? []).map(q => ({
    name: q.question_type,
    questions_answered: q.questions_answered,
    correct_count: q.correct_count,
    accuracy: q.accuracy
  }))
}

// 難易度別正答率
export async function getAccuracyByDifficulty(): Promise<CategoryStats[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("user_stats_by_difficulty")
    .select("*")
    .eq("user_id", user.id)
    .order("difficulty", { ascending: true })

  if (error) {
    console.error("Error fetching difficulty stats:", error)
    return []
  }

  const difficultyLabels: Record<number, string> = {
    1: "初級 (400-500)",
    2: "初中級 (500-600)",
    3: "中級 (600-700)",
    4: "中上級 (700-800)",
    5: "上級 (800-900)"
  }

  return (data ?? []).map(d => ({
    name: difficultyLabels[d.difficulty] || `Level ${d.difficulty}`,
    questions_answered: d.questions_answered,
    correct_count: d.correct_count,
    accuracy: d.accuracy
  }))
}

// 弱点分析（正答率が低いカテゴリを抽出）
export async function getWeakAreas(): Promise<WeakAreas> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { documentTypes: [], questionTypes: [] }

  const [docTypeResult, questionTypeResult] = await Promise.all([
    supabase
      .from("user_stats_by_document_type")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("user_stats_by_question_type")
      .select("*")
      .eq("user_id", user.id)
  ])

  const weakDocTypes = (docTypeResult.data ?? [])
    .filter(d => d.accuracy < 70 && d.questions_answered >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map(d => ({
      document_type: d.document_type,
      accuracy: d.accuracy,
      questions_answered: d.questions_answered
    }))

  const weakQuestionTypes = (questionTypeResult.data ?? [])
    .filter(q => q.accuracy < 70 && q.questions_answered >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map(q => ({
      question_type: q.question_type,
      accuracy: q.accuracy,
      questions_answered: q.questions_answered
    }))

  return {
    documentTypes: weakDocTypes,
    questionTypes: weakQuestionTypes
  }
}

// 総合サマリー
export async function getAnalyticsSummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 今週のデータ
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: weeklyData } = await supabase
    .from("daily_user_stats")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", weekAgo.toISOString().split("T")[0])

  const weeklyStats = (weeklyData ?? []).reduce(
    (acc, day) => ({
      questions: acc.questions + day.questions_answered,
      correct: acc.correct + day.correct_count,
      time: acc.time + day.total_time_seconds
    }),
    { questions: 0, correct: 0, time: 0 }
  )

  const weeklyAccuracy = weeklyStats.questions > 0
    ? Math.round((weeklyStats.correct / weeklyStats.questions) * 100)
    : 0

  // 全期間のデータ
  const { data: allTimeData } = await supabase
    .from("daily_user_stats")
    .select("*")
    .eq("user_id", user.id)

  const allTimeStats = (allTimeData ?? []).reduce(
    (acc, day) => ({
      questions: acc.questions + day.questions_answered,
      correct: acc.correct + day.correct_count,
      time: acc.time + day.total_time_seconds
    }),
    { questions: 0, correct: 0, time: 0 }
  )

  const allTimeAccuracy = allTimeStats.questions > 0
    ? Math.round((allTimeStats.correct / allTimeStats.questions) * 100)
    : 0

  return {
    weekly: {
      questions: weeklyStats.questions,
      accuracy: weeklyAccuracy,
      timeMinutes: Math.round(weeklyStats.time / 60)
    },
    allTime: {
      questions: allTimeStats.questions,
      accuracy: allTimeAccuracy,
      timeMinutes: Math.round(allTimeStats.time / 60)
    }
  }
}
