import { APIError } from "openai"

export class OpenAIGenerationError extends Error {
  public readonly code: string
  public readonly statusCode?: number

  constructor(message: string, code: string, statusCode?: number) {
    super(message)
    this.name = "OpenAIGenerationError"
    this.code = code
    this.statusCode = statusCode
  }
}

export function handleOpenAIError(error: unknown): OpenAIGenerationError {
  if (error instanceof APIError) {
    const statusCode = error.status

    switch (statusCode) {
      case 401:
        return new OpenAIGenerationError(
          "OpenAI APIキーが無効です。管理者に連絡してください。",
          "INVALID_API_KEY",
          statusCode
        )
      case 429:
        return new OpenAIGenerationError(
          "APIリクエスト制限に達しました。しばらく待ってから再試行してください。",
          "RATE_LIMIT_EXCEEDED",
          statusCode
        )
      case 500:
      case 502:
      case 503:
        return new OpenAIGenerationError(
          "OpenAIサービスが一時的に利用できません。しばらく待ってから再試行してください。",
          "SERVICE_UNAVAILABLE",
          statusCode
        )
      default:
        return new OpenAIGenerationError(
          `OpenAI APIエラー: ${error.message}`,
          "API_ERROR",
          statusCode
        )
    }
  }

  if (error instanceof Error) {
    return new OpenAIGenerationError(
      `予期しないエラー: ${error.message}`,
      "UNKNOWN_ERROR"
    )
  }

  return new OpenAIGenerationError(
    "不明なエラーが発生しました",
    "UNKNOWN_ERROR"
  )
}

export function isOpenAIGenerationError(error: unknown): error is OpenAIGenerationError {
  return error instanceof OpenAIGenerationError
}
