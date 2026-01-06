export type DocumentType =
  | "email"
  | "article"
  | "notice"
  | "advertisement"
  | "letter"
  | "chat"
  | "form"
  | "review"

export type QuestionType =
  | "main_idea"
  | "detail"
  | "inference"
  | "vocabulary"
  | "purpose"

export interface Profile {
  id: string
  email: string
  name: string | null
  target_score: number
  current_score: number | null
  created_at: string
  updated_at: string
}

export interface ReadingPassage {
  id: string
  title: string
  document_type: DocumentType
  content: string
  difficulty: number
  is_multiple_passage: boolean
  created_at: string
}

export interface ReadingQuestion {
  id: string
  passage_id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  correct_answer: number
  explanation: string | null
  order_index: number
  created_at: string
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  passage_id: string
  selected_answer: number
  is_correct: boolean
  time_spent_seconds: number | null
  answered_at: string
}

// 拡張型
export interface PassageWithQuestions extends ReadingPassage {
  questions: ReadingQuestion[]
}

export interface PassageWithProgress extends ReadingPassage {
  question_count: number
  user_progress: {
    answered_count: number
    correct_count: number
  } | null
}
