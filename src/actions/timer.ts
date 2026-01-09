"use server"

import { createClient } from "@/lib/supabase/server"
import { getGrammarRecommendedTime } from "@/lib/timer-utils"

// 時間統計を取得
export async function getTimeStats(): Promise<{
  reading: {
    total: number
    average: number
    count: number
  }
  grammar: {
    total: number
    average: number
    count: number
  }
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 長文読解の時間統計
  const { data: readingStats } = await supabase
    .from("user_answers")
    .select("time_spent_seconds")
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  // 文法問題の時間統計
  const { data: grammarStats } = await supabase
    .from("grammar_answers")
    .select("time_spent_seconds")
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  const readingTimes =
    readingStats?.map((s) => s.time_spent_seconds).filter(Boolean) || []
  const grammarTimes =
    grammarStats?.map((s) => s.time_spent_seconds).filter(Boolean) || []

  return {
    reading: {
      total: readingTimes.reduce((a, b) => a + (b || 0), 0),
      average:
        readingTimes.length > 0
          ? Math.round(
              readingTimes.reduce((a, b) => a + (b || 0), 0) / readingTimes.length
            )
          : 0,
      count: readingTimes.length,
    },
    grammar: {
      total: grammarTimes.reduce((a, b) => a + (b || 0), 0),
      average:
        grammarTimes.length > 0
          ? Math.round(
              grammarTimes.reduce((a, b) => a + (b || 0), 0) / grammarTimes.length
            )
          : 0,
      count: grammarTimes.length,
    },
  }
}

// 時間超過率を取得
export async function getTimeOverruns(): Promise<{
  grammar: {
    overrunCount: number
    totalCount: number
    overrunRate: number
  }
  reading: {
    overrunCount: number
    totalCount: number
    overrunRate: number
  }
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 文法問題の時間超過を計算
  const { data: grammarAnswers } = await supabase
    .from("grammar_answers")
    .select(
      `
      time_spent_seconds,
      grammar_questions(difficulty)
    `
    )
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  let grammarOverruns = 0
  let grammarTotal = 0

  grammarAnswers?.forEach((answer) => {
    const difficulty =
      (answer.grammar_questions as { difficulty: number } | null)?.difficulty || 3
    const recommended = getGrammarRecommendedTime(difficulty)

    if (answer.time_spent_seconds && answer.time_spent_seconds > recommended) {
      grammarOverruns++
    }
    grammarTotal++
  })

  // 長文読解の時間超過を計算（シングルパッセージの推奨時間で計算）
  const { data: readingAnswers } = await supabase
    .from("user_answers")
    .select("time_spent_seconds")
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  let readingOverruns = 0
  let readingTotal = 0

  readingAnswers?.forEach((answer) => {
    // 1問あたりの推奨時間（3分/5問として約36秒）
    const recommendedPerQuestion = 36
    if (
      answer.time_spent_seconds &&
      answer.time_spent_seconds > recommendedPerQuestion
    ) {
      readingOverruns++
    }
    readingTotal++
  })

  return {
    grammar: {
      overrunCount: grammarOverruns,
      totalCount: grammarTotal,
      overrunRate:
        grammarTotal > 0 ? Math.round((grammarOverruns / grammarTotal) * 100) : 0,
    },
    reading: {
      overrunCount: readingOverruns,
      totalCount: readingTotal,
      overrunRate:
        readingTotal > 0 ? Math.round((readingOverruns / readingTotal) * 100) : 0,
    },
  }
}

// 総学習時間を取得（秒）
export async function getTotalStudyTime(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const [readingResult, grammarResult] = await Promise.all([
    supabase
      .from("user_answers")
      .select("time_spent_seconds")
      .eq("user_id", user.id)
      .not("time_spent_seconds", "is", null),
    supabase
      .from("grammar_answers")
      .select("time_spent_seconds")
      .eq("user_id", user.id)
      .not("time_spent_seconds", "is", null),
  ])

  const readingTime =
    readingResult.data?.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) ||
    0
  const grammarTime =
    grammarResult.data?.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) ||
    0

  return readingTime + grammarTime
}
