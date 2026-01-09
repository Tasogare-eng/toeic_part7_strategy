// 文法カテゴリ
export type GrammarCategory =
  | "parts_of_speech" // 品詞
  | "tense" // 時制
  | "relative_clause" // 関係詞
  | "conjunction" // 接続詞
  | "preposition" // 前置詞
  | "subjunctive" // 仮定法
  | "passive" // 受動態
  | "comparison" // 比較
  | "article" // 冠詞
  | "pronoun" // 代名詞

export interface GrammarQuestion {
  id: string
  question_text: string
  options: string[] // ["A) ...", "B) ...", "C) ...", "D) ..."]
  correct_answer: "A" | "B" | "C" | "D"
  explanation: string
  category: GrammarCategory
  subcategory: string | null
  difficulty: number // 1-5
  grammar_point: string | null
  is_ai_generated: boolean
  ai_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface GrammarAnswer {
  id: string
  user_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  time_spent_seconds: number | null
  answered_at: string
}

export interface GrammarQuestionWithAnswer extends GrammarQuestion {
  user_answer: GrammarAnswer | null
}

// カテゴリラベル
export const GRAMMAR_CATEGORY_LABELS: Record<GrammarCategory, string> = {
  parts_of_speech: "品詞",
  tense: "時制",
  relative_clause: "関係詞",
  conjunction: "接続詞",
  preposition: "前置詞",
  subjunctive: "仮定法",
  passive: "受動態",
  comparison: "比較",
  article: "冠詞",
  pronoun: "代名詞",
}

// 難易度ラベル
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "とても簡単",
  2: "簡単",
  3: "普通",
  4: "難しい",
  5: "とても難しい",
}
