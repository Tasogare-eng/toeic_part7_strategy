import { describe, it, expect } from "vitest"
import {
  OpenAIGenerationError,
  handleOpenAIError,
  isOpenAIGenerationError,
} from "@/lib/openai/errors"
import { APIError } from "openai"

// APIErrorをシミュレートするヘルパー
function createMockAPIError(status: number, message: string): APIError {
  const error = new Error(message) as APIError
  error.status = status
  error.message = message
  Object.setPrototypeOf(error, APIError.prototype)
  return error
}

describe("OpenAI Errors", () => {
  describe("OpenAIGenerationError", () => {
    it("should create an error with message, code, and statusCode", () => {
      const error = new OpenAIGenerationError("Test error", "TEST_CODE", 500)

      expect(error.message).toBe("Test error")
      expect(error.code).toBe("TEST_CODE")
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe("OpenAIGenerationError")
    })

    it("should work without statusCode", () => {
      const error = new OpenAIGenerationError("Test error", "TEST_CODE")

      expect(error.message).toBe("Test error")
      expect(error.code).toBe("TEST_CODE")
      expect(error.statusCode).toBeUndefined()
    })
  })

  describe("handleOpenAIError", () => {
    it("should handle 401 error", () => {
      const apiError = createMockAPIError(401, "Invalid API key")
      const result = handleOpenAIError(apiError)

      expect(result.code).toBe("INVALID_API_KEY")
      expect(result.statusCode).toBe(401)
      expect(result.message).toContain("APIキーが無効")
    })

    it("should handle 429 rate limit error", () => {
      const apiError = createMockAPIError(429, "Rate limit exceeded")
      const result = handleOpenAIError(apiError)

      expect(result.code).toBe("RATE_LIMIT_EXCEEDED")
      expect(result.statusCode).toBe(429)
      expect(result.message).toContain("リクエスト制限")
    })

    it("should handle 500/502/503 server errors", () => {
      const serverErrors = [500, 502, 503]

      for (const status of serverErrors) {
        const apiError = createMockAPIError(status, "Server error")
        const result = handleOpenAIError(apiError)

        expect(result.code).toBe("SERVICE_UNAVAILABLE")
        expect(result.statusCode).toBe(status)
        expect(result.message).toContain("一時的に利用できません")
      }
    })

    it("should handle other API errors", () => {
      const apiError = createMockAPIError(400, "Bad request")
      const result = handleOpenAIError(apiError)

      expect(result.code).toBe("API_ERROR")
      expect(result.statusCode).toBe(400)
    })

    it("should handle regular Error", () => {
      const error = new Error("Something went wrong")
      const result = handleOpenAIError(error)

      expect(result.code).toBe("UNKNOWN_ERROR")
      expect(result.message).toContain("予期しないエラー")
    })

    it("should handle unknown error types", () => {
      const result = handleOpenAIError("string error")

      expect(result.code).toBe("UNKNOWN_ERROR")
      expect(result.message).toBe("不明なエラーが発生しました")
    })
  })

  describe("isOpenAIGenerationError", () => {
    it("should return true for OpenAIGenerationError", () => {
      const error = new OpenAIGenerationError("Test", "CODE")
      expect(isOpenAIGenerationError(error)).toBe(true)
    })

    it("should return false for other errors", () => {
      expect(isOpenAIGenerationError(new Error("Test"))).toBe(false)
      expect(isOpenAIGenerationError("string")).toBe(false)
      expect(isOpenAIGenerationError(null)).toBe(false)
    })
  })
})
