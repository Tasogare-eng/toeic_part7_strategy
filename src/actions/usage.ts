"use server"

import { createClient } from "@/lib/supabase/server"
import { getPlanType } from "./subscription"
import {
  UsageType,
  DailyUsageType,
  FeatureType,
  UsageCheckResult,
  FeatureCheckResult,
  UsageSummary,
  UsageLimits,
  PlanLimits,
  PLAN_LIMITS,
  PlanType,
} from "@/types/subscription"

// ========================================
// ヘルパー関数
// ========================================

/**
 * 利用タイプからDBカラム名を取得
 */
function getColumnName(usageType: UsageType): string {
  const columnMap: Record<UsageType, string> = {
    reading: "reading_count",
    grammar: "grammar_count",
    vocabulary: "vocabulary_count",
    ai_passage: "ai_passage_count",
    ai_grammar: "ai_grammar_count",
    ai_vocabulary: "ai_vocabulary_count",
  }
  return columnMap[usageType]
}

/**
 * 利用タイプの制限値を取得
 */
function getUsageLimit(
  usageType: UsageType,
  planLimits: PlanLimits
): number | null {
  const limitMap: Record<UsageType, number | null> = {
    reading: planLimits.reading,
    grammar: planLimits.grammar,
    vocabulary: planLimits.vocabulary,
    ai_passage: planLimits.aiPassageMonthly,
    ai_grammar: planLimits.aiGrammarMonthly,
    ai_vocabulary: planLimits.aiVocabularyMonthly,
  }
  return limitMap[usageType]
}

/**
 * 月次利用かどうかを判定
 */
function isMonthlyUsage(usageType: UsageType): boolean {
  return ["ai_passage", "ai_grammar", "ai_vocabulary"].includes(usageType)
}

/**
 * UsageCheckResultを作成
 */
function createUsageCheckResult(
  current: number,
  limit: number | null
): UsageCheckResult {
  const isUnlimited = limit === null
  const allowed = isUnlimited || current < limit
  const remaining = isUnlimited ? null : Math.max(limit - current, 0)

  return {
    allowed,
    current,
    limit,
    remaining,
  }
}

// ========================================
// コアAPI
// ========================================

/**
 * 今日の利用状況を取得
 */
export async function getTodayUsage(): Promise<UsageLimits | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .single()

  if (error || !data) {
    // レコードがない場合はデフォルト値を返す
    return {
      readingCount: 0,
      grammarCount: 0,
      vocabularyCount: 0,
      aiPassageCount: 0,
      aiGrammarCount: 0,
      aiVocabularyCount: 0,
    }
  }

  return {
    readingCount: data.reading_count,
    grammarCount: data.grammar_count,
    vocabularyCount: data.vocabulary_count,
    aiPassageCount: data.ai_passage_count,
    aiGrammarCount: data.ai_grammar_count,
    aiVocabularyCount: data.ai_vocabulary_count,
  }
}

/**
 * 利用可能かどうかをチェック（インクリメントなし）
 */
export async function canUseUsage(
  usageType: UsageType
): Promise<UsageCheckResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 }
  }

  const planType = await getPlanType()
  const planLimits = PLAN_LIMITS[planType]
  const limit = getUsageLimit(usageType, planLimits)

  // 無制限の場合は即座にtrueを返す
  if (limit === null) {
    return { allowed: true, current: 0, limit: null, remaining: null }
  }

  // 現在の利用回数を取得
  const usage = await getTodayUsage()
  if (!usage) {
    return { allowed: false, current: 0, limit, remaining: limit }
  }

  // 利用タイプに応じた現在値を取得
  const currentCountMap: Record<UsageType, number> = {
    reading: usage.readingCount,
    grammar: usage.grammarCount,
    vocabulary: usage.vocabularyCount,
    ai_passage: usage.aiPassageCount,
    ai_grammar: usage.aiGrammarCount,
    ai_vocabulary: usage.aiVocabularyCount,
  }

  const current = currentCountMap[usageType]
  return createUsageCheckResult(current, limit)
}

/**
 * 利用回数をインクリメント（制限チェック付き）
 * アトミックな操作で競合状態を防止
 */
export async function incrementUsage(
  usageType: UsageType
): Promise<UsageCheckResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 }
  }

  const planType = await getPlanType()
  const planLimits = PLAN_LIMITS[planType]
  const limit = getUsageLimit(usageType, planLimits)

  // 無制限の場合でもカウントは記録する（分析用）
  const today = new Date().toISOString().split("T")[0]
  const columnName = getColumnName(usageType)

  // まず現在の値をチェック
  if (limit !== null) {
    const currentCheck = await canUseUsage(usageType)
    if (!currentCheck.allowed) {
      return currentCheck
    }
  }

  // RPC関数でアトミックにインクリメント
  const { data: newCount, error } = await supabase.rpc("increment_usage_count", {
    p_user_id: user.id,
    p_usage_date: today,
    p_column_name: columnName,
  })

  if (error) {
    console.error("Increment usage error:", error)
    // エラー時は現在の状態を返す
    return await canUseUsage(usageType)
  }

  // 新しい値で結果を作成
  return createUsageCheckResult(newCount, limit)
}

/**
 * 機能アクセス可否をチェック（Pro限定機能）
 */
export async function canUseFeature(
  feature: FeatureType
): Promise<FeatureCheckResult> {
  const planType = await getPlanType()
  const planLimits = PLAN_LIMITS[planType]

  const featureCheckMap: Record<FeatureType, boolean> = {
    mock_exam: planLimits.mockExamMini || planLimits.mockExamFull,
    detailed_analytics: planLimits.detailedAnalytics,
    review_schedule: planLimits.reviewSchedule,
    bookmarks: planLimits.bookmarks !== 0,
    ai_generation:
      planLimits.aiPassageMonthly !== 0 ||
      planLimits.aiGrammarMonthly !== 0 ||
      planLimits.aiVocabularyMonthly !== 0,
  }

  const allowed = featureCheckMap[feature]

  if (allowed) {
    return { allowed: true }
  }

  const featureNames: Record<FeatureType, string> = {
    mock_exam: "模試機能",
    detailed_analytics: "詳細分析",
    review_schedule: "復習スケジュール",
    bookmarks: "ブックマーク",
    ai_generation: "AI問題生成",
  }

  return {
    allowed: false,
    reason: `${featureNames[feature]}は Pro プラン限定機能です`,
    upgradeRequired: true,
  }
}

/**
 * 利用状況サマリーを取得（ダッシュボード用）
 */
export async function getUsageSummary(): Promise<UsageSummary | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const planType = await getPlanType()
  const planLimits = PLAN_LIMITS[planType]
  const usage = await getTodayUsage()

  if (!usage) {
    return null
  }

  return {
    planType,
    daily: {
      reading: createUsageCheckResult(usage.readingCount, planLimits.reading),
      grammar: createUsageCheckResult(usage.grammarCount, planLimits.grammar),
      vocabulary: createUsageCheckResult(
        usage.vocabularyCount,
        planLimits.vocabulary
      ),
    },
    features: {
      mockExam: planLimits.mockExamMini || planLimits.mockExamFull,
      detailedAnalytics: planLimits.detailedAnalytics,
      reviewSchedule: planLimits.reviewSchedule,
      bookmarks: planLimits.bookmarks !== 0,
      aiGeneration:
        planLimits.aiPassageMonthly !== 0 ||
        planLimits.aiGrammarMonthly !== 0 ||
        planLimits.aiVocabularyMonthly !== 0,
    },
  }
}

/**
 * 日次利用状況のみを取得（軽量版）
 */
export async function getDailyUsageStatus(
  usageType: DailyUsageType
): Promise<UsageCheckResult> {
  return await canUseUsage(usageType)
}
