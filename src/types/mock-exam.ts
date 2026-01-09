export type MockExamType = "full" | "mini_15" | "mini_30"
export type MockExamStatus = "in_progress" | "completed" | "abandoned"
export type MockExamPart = "part5" | "part6" | "part7"
export type MockExamQuestionType = "grammar" | "reading"

export interface MockExam {
  id: string
  user_id: string
  exam_type: MockExamType
  status: MockExamStatus
  time_limit_minutes: number
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface MockExamQuestion {
  id: string
  mock_exam_id: string
  part: MockExamPart
  question_type: MockExamQuestionType
  question_id: string
  passage_id: string | null
  order_index: number
  is_ai_generated: boolean
  created_at: string
}

export interface MockExamAnswer {
  id: string
  mock_exam_id: string
  mock_question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  time_spent_seconds: number | null
  answered_at: string | null
  created_at: string
}

export interface MockExamResult {
  id: string
  mock_exam_id: string
  user_id: string
  total_questions: number
  correct_count: number
  part5_total: number
  part5_correct: number
  part6_total: number
  part6_correct: number
  part7_total: number
  part7_correct: number
  total_time_seconds: number
  estimated_score: number | null
  created_at: string
}

export interface MockExamConfig {
  type: MockExamType
  label: string
  description: string
  timeLimit: number
  part5Count: number
  part6Count: number
  part7Count: number
}

export const MOCK_EXAM_CONFIGS: Record<MockExamType, MockExamConfig> = {
  full: {
    type: "full",
    label: "フル模試",
    description: "本番と同じ100問形式",
    timeLimit: 75,
    part5Count: 30,
    part6Count: 16,
    part7Count: 54,
  },
  mini_30: {
    type: "mini_30",
    label: "ミニ模試 30分",
    description: "短時間で実力チェック",
    timeLimit: 30,
    part5Count: 15,
    part6Count: 4,
    part7Count: 10,
  },
  mini_15: {
    type: "mini_15",
    label: "ミニ模試 15分",
    description: "スキマ時間で練習",
    timeLimit: 15,
    part5Count: 10,
    part6Count: 0,
    part7Count: 5,
  },
}

// 拡張型（関連データを含む）
export interface MockExamQuestionWithData extends MockExamQuestion {
  grammar_question?: {
    id: string
    question_text: string
    options: string[]
    correct_answer: string
    explanation: string
    category: string
    grammar_point?: string
  }
  reading_question?: {
    id: string
    question_text: string
    options: string[]
    correct_answer: number
    explanation?: string
    question_type: string
  }
  passage?: {
    id: string
    title: string
    content: string
    document_type: string
    difficulty: number
  }
}

export interface MockExamResultWithExam extends MockExamResult {
  mock_exam: MockExam
}
