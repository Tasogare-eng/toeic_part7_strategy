"use server"

import { unstable_cache } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache"

export interface DashboardStats {
  totalAnswered: number
  correctCount: number
  accuracyRate: number
  targetProgress: number
}

// ダッシュボード統計 - 内部実装（キャッシュ用にService Clientを使用）
async function getDashboardStatsImpl(userId: string): Promise<DashboardStats> {
  const supabase = createServiceClient()

  const { data: answers } = await supabase
    .from("user_answers")
    .select("is_correct")
    .eq("user_id", userId)

  if (!answers || answers.length === 0) {
    return {
      totalAnswered: 0,
      correctCount: 0,
      accuracyRate: 0,
      targetProgress: 0,
    }
  }

  const totalAnswered = answers.length
  const correctCount = answers.filter((a) => a.is_correct).length
  const accuracyRate = Math.round((correctCount / totalAnswered) * 100)
  const targetProgress = Math.min(Math.round((accuracyRate / 90) * 100), 100)

  return {
    totalAnswered,
    correctCount,
    accuracyRate,
    targetProgress,
  }
}

// ダッシュボード統計 - キャッシュ付き
export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return unstable_cache(
    () => getDashboardStatsImpl(user.id),
    [`dashboard-stats-${user.id}`],
    {
      revalidate: CACHE_TIMES.MEDIUM,
      tags: [CACHE_TAGS.DASHBOARD, `user-${user.id}`]
    }
  )()
}

export interface RecentActivity {
  passageId: string
  passageTitle: string
  documentType: string
  answeredCount: number
  correctCount: number
  answeredAt: string
}

// 最近のアクティビティ - 内部実装（キャッシュ用にService Clientを使用）
async function getRecentActivityImpl(userId: string, limit: number): Promise<RecentActivity[]> {
  const supabase = createServiceClient()

  const { data: answers } = await supabase
    .from("user_answers")
    .select(`
      passage_id,
      is_correct,
      answered_at,
      reading_passages(title, document_type)
    `)
    .eq("user_id", userId)
    .order("answered_at", { ascending: false })

  if (!answers) return []

  // パッセージごとにグループ化
  const grouped = answers.reduce((acc, answer) => {
    const key = answer.passage_id
    const passageData = answer.reading_passages as unknown as { title: string; document_type: string } | null
    if (!acc[key]) {
      acc[key] = {
        passageId: answer.passage_id,
        passageTitle: passageData?.title || "",
        documentType: passageData?.document_type || "",
        answeredCount: 0,
        correctCount: 0,
        answeredAt: answer.answered_at,
      }
    }
    acc[key].answeredCount++
    if (answer.is_correct) acc[key].correctCount++
    return acc
  }, {} as Record<string, RecentActivity>)

  return Object.values(grouped).slice(0, limit)
}

// 最近のアクティビティ - キャッシュ付き
export async function getRecentActivity(limit = 5): Promise<RecentActivity[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  return unstable_cache(
    () => getRecentActivityImpl(user.id, limit),
    [`recent-activity-${user.id}-${limit}`],
    {
      revalidate: CACHE_TIMES.SHORT,
      tags: [CACHE_TAGS.DASHBOARD, `user-${user.id}`]
    }
  )()
}
