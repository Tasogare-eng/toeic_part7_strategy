import { describe, it, expect, vi, beforeEach } from "vitest"
import { getOpenAIModel, getMaxTokens } from "@/lib/openai/client"

describe("OpenAI Client", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe("getOpenAIModel", () => {
    it("should return the model from environment variable", () => {
      const model = getOpenAIModel()
      expect(model).toBe("gpt-4-turbo-preview")
    })

    it("should return default model if not set", () => {
      vi.stubEnv("OPENAI_MODEL", "")
      const model = getOpenAIModel()
      // When empty string, || returns default
      expect(model).toBe("gpt-4-turbo-preview")
    })
  })

  describe("getMaxTokens", () => {
    it("should return max tokens from environment variable", () => {
      const maxTokens = getMaxTokens()
      expect(maxTokens).toBe(4000)
    })

    it("should return default value if not set", () => {
      vi.stubEnv("OPENAI_MAX_TOKENS", "")
      const maxTokens = getMaxTokens()
      expect(maxTokens).toBe(4000) // Default when parsing empty string returns NaN, fallback to 4000
    })
  })
})
