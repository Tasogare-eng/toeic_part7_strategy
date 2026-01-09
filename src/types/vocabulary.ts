// 品詞タイプ
export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"

// 単語レベル (1:600点, 2:700点, 3:800点, 4:900点)
export type VocabularyLevel = 1 | 2 | 3 | 4

// 単語カテゴリ
export type VocabularyCategory =
  | "business"
  | "finance"
  | "marketing"
  | "hr"
  | "technology"
  | "travel"
  | "general"

export interface Vocabulary {
  id: string
  word: string
  meaning: string
  pronunciation: string | null
  part_of_speech: PartOfSpeech | null
  level: VocabularyLevel
  example_sentence: string | null
  example_translation: string | null
  category: VocabularyCategory | null
  synonyms: string[] | null
  is_ai_generated: boolean
  ai_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface VocabularyProgress {
  id: string
  user_id: string
  vocabulary_id: string
  familiarity: number // 0-5
  correct_count: number
  incorrect_count: number
  last_reviewed_at: string | null
  next_review_at: string | null
  review_interval_days: number
  created_at: string
  updated_at: string
}

export interface VocabularyWithProgress extends Vocabulary {
  vocabulary_progress: VocabularyProgress[] | null
}

// フラッシュカード用
export interface FlashcardState {
  currentIndex: number
  isFlipped: boolean
  direction: "en-to-ja" | "ja-to-en"
}

// レベルラベル
export const LEVEL_LABELS: Record<VocabularyLevel, string> = {
  1: "600点",
  2: "700点",
  3: "800点",
  4: "900点",
}

// カテゴリラベル
export const CATEGORY_LABELS: Record<VocabularyCategory, string> = {
  business: "ビジネス",
  finance: "金融",
  marketing: "マーケティング",
  hr: "人事",
  technology: "テクノロジー",
  travel: "旅行",
  general: "一般",
}

// 品詞ラベル
export const PART_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  noun: "名詞",
  verb: "動詞",
  adjective: "形容詞",
  adverb: "副詞",
  preposition: "前置詞",
  conjunction: "接続詞",
}
