import type { DocumentType, QuestionType } from "./database"

// 長文生成リクエスト
export interface PassageGenerationRequest {
  documentType: DocumentType
  difficulty: 1 | 2 | 3 | 4 | 5
  topic?: string
  wordCount?: number
}

// 長文生成レスポンス
export interface GeneratedPassage {
  title: string
  content: string
  documentType: DocumentType
  difficulty: number
}

// 設問生成リクエスト
export interface QuestionGenerationRequest {
  passageId: string
  passageContent: string
  passageTitle: string
  documentType: DocumentType
  questionCount: number
  questionTypes?: QuestionType[]
}

// 設問生成レスポンス
export interface GeneratedQuestion {
  questionText: string
  questionType: QuestionType
  options: string[]
  correctAnswer: number
  explanation: string
}

// AI生成メタデータ
export interface AIMetadata {
  model: string
  generatedAt: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

// API レスポンス型
export interface GenerationResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: AIMetadata
}
