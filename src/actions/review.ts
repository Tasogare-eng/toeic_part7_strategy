"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ReviewItemType, Bookmark, ReviewScheduleItem } from "@/types/review"

// ブックマーク追加
export async function addBookmark(
  itemType: ReviewItemType,
  itemId: string,
  note?: string
): Promise<Bookmark> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("bookmarks")
    .upsert(
      {
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        note: note || null,
      },
      {
        onConflict: "user_id,item_type,item_id",
      }
    )
    .select()
    .single()

  if (error) throw error

  revalidatePath("/review")
  return data
}

// ブックマーク削除
export async function removeBookmark(
  itemType: ReviewItemType,
  itemId: string
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)

  if (error) throw error

  revalidatePath("/review")
}

// ブックマーク確認
export async function isBookmarked(
  itemType: ReviewItemType,
  itemId: string
): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .single()

  return !!data
}

// ブックマーク一覧取得
export async function getBookmarks(
  itemType?: ReviewItemType
): Promise<Bookmark[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (itemType) {
    query = query.eq("item_type", itemType)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// 今日の復習スケジュールを取得
export async function getTodayReviewSchedule(): Promise<ReviewScheduleItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("review_schedule")
    .select("*")
    .eq("user_id", user.id)
    .lte("scheduled_date", today)
    .eq("is_completed", false)
    .order("priority", { ascending: false })
    .order("scheduled_date", { ascending: true })

  if (error) throw error
  return data || []
}

// 復習アイテムを完了としてマーク
export async function completeReviewItem(scheduleId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { error } = await supabase
    .from("review_schedule")
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/review")
}

// 復習スケジュールを追加
export async function addReviewSchedule(
  itemType: ReviewItemType,
  itemId: string,
  scheduledDate: Date,
  priority: 1 | 2 | 3 = 2
): Promise<ReviewScheduleItem> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("review_schedule")
    .upsert(
      {
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        scheduled_date: scheduledDate.toISOString().split("T")[0],
        priority,
      },
      {
        onConflict: "user_id,item_type,item_id,scheduled_date",
      }
    )
    .select()
    .single()

  if (error) throw error

  revalidatePath("/review")
  return data
}

// 間違えた問題から復習スケジュールを自動生成
export async function generateReviewScheduleFromMistakes(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 過去7日間の間違えた問題を取得（長文）
  const { data: readingMistakes } = await supabase
    .from("user_answers")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .gte("answered_at", sevenDaysAgo)

  // 過去7日間の間違えた問題を取得（文法）
  const { data: grammarMistakes } = await supabase
    .from("grammar_answers")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .gte("answered_at", sevenDaysAgo)

  const scheduleItems: Array<{
    user_id: string
    item_type: ReviewItemType
    item_id: string
    scheduled_date: string
    priority: number
  }> = []

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const scheduledDate = tomorrow.toISOString().split("T")[0]

  // 長文問題のスケジュール作成（重複を除去）
  const readingIds = new Set<string>()
  readingMistakes?.forEach((item) => {
    if (!readingIds.has(item.question_id)) {
      readingIds.add(item.question_id)
      scheduleItems.push({
        user_id: user.id,
        item_type: "reading",
        item_id: item.question_id,
        scheduled_date: scheduledDate,
        priority: 2,
      })
    }
  })

  // 文法問題のスケジュール作成（重複を除去）
  const grammarIds = new Set<string>()
  grammarMistakes?.forEach((item) => {
    if (!grammarIds.has(item.question_id)) {
      grammarIds.add(item.question_id)
      scheduleItems.push({
        user_id: user.id,
        item_type: "grammar",
        item_id: item.question_id,
        scheduled_date: scheduledDate,
        priority: 2,
      })
    }
  })

  if (scheduleItems.length > 0) {
    const { error } = await supabase.from("review_schedule").upsert(
      scheduleItems,
      {
        onConflict: "user_id,item_type,item_id,scheduled_date",
      }
    )

    if (error) throw error
  }

  revalidatePath("/review")
  return scheduleItems.length
}

// 復習統計を取得
export async function getReviewStats(): Promise<{
  totalBookmarks: number
  pendingReviews: number
  completedToday: number
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return {
      totalBookmarks: 0,
      pendingReviews: 0,
      completedToday: 0,
    }

  const today = new Date().toISOString().split("T")[0]

  const [bookmarksResult, pendingResult, completedResult] = await Promise.all([
    supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("review_schedule")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("scheduled_date", today)
      .eq("is_completed", false),
    supabase
      .from("review_schedule")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .gte("completed_at", `${today}T00:00:00`),
  ])

  return {
    totalBookmarks: bookmarksResult.count || 0,
    pendingReviews: pendingResult.count || 0,
    completedToday: completedResult.count || 0,
  }
}
