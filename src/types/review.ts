export type ReviewItemType = "vocabulary" | "grammar" | "reading"

export interface Bookmark {
  id: string
  user_id: string
  item_type: ReviewItemType
  item_id: string
  note: string | null
  created_at: string
}

export interface ReviewScheduleItem {
  id: string
  user_id: string
  item_type: ReviewItemType
  item_id: string
  scheduled_date: string
  priority: 1 | 2 | 3
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

// 間隔反復学習の設定
export interface SpacedRepetitionConfig {
  // 正解時の間隔乗数
  correctMultiplier: number // default: 2.5
  // 不正解時の間隔
  incorrectInterval: number // default: 1 (day)
  // 最大間隔（日）
  maxInterval: number // default: 180
  // 最小間隔（日）
  minInterval: number // default: 1
}

// デフォルトの間隔反復設定
export const DEFAULT_SPACED_REPETITION_CONFIG: SpacedRepetitionConfig = {
  correctMultiplier: 2.5,
  incorrectInterval: 1,
  maxInterval: 180,
  minInterval: 1,
}

// 復習アイテムタイプのラベル
export const REVIEW_ITEM_TYPE_LABELS: Record<ReviewItemType, string> = {
  vocabulary: "単語",
  grammar: "文法",
  reading: "長文",
}

// 優先度ラベル
export const PRIORITY_LABELS: Record<1 | 2 | 3, string> = {
  1: "低",
  2: "中",
  3: "高",
}
