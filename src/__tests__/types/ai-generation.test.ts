import { describe, it, expect } from "vitest"
import type {
  PassageGenerationRequest,
  GeneratedPassage,
  QuestionGenerationRequest,
  GeneratedQuestion,
  AIMetadata,
  GenerationResult,
} from "@/types/ai-generation"

describe("AI Generation Types", () => {
  describe("PassageGenerationRequest", () => {
    it("should accept valid passage generation request", () => {
      const request: PassageGenerationRequest = {
        documentType: "email",
        difficulty: 3,
        topic: "Meeting schedule",
        wordCount: 200,
      }

      expect(request.documentType).toBe("email")
      expect(request.difficulty).toBe(3)
      expect(request.topic).toBe("Meeting schedule")
      expect(request.wordCount).toBe(200)
    })

    it("should accept request without optional fields", () => {
      const request: PassageGenerationRequest = {
        documentType: "article",
        difficulty: 4,
      }

      expect(request.documentType).toBe("article")
      expect(request.difficulty).toBe(4)
      expect(request.topic).toBeUndefined()
      expect(request.wordCount).toBeUndefined()
    })

    it("should accept all valid document types", () => {
      const documentTypes = ["email", "article", "notice", "advertisement", "letter", "chat", "form", "review"] as const

      for (const docType of documentTypes) {
        const request: PassageGenerationRequest = {
          documentType: docType,
          difficulty: 3,
        }
        expect(request.documentType).toBe(docType)
      }
    })

    it("should accept all valid difficulty levels", () => {
      const difficulties = [1, 2, 3, 4, 5] as const

      for (const difficulty of difficulties) {
        const request: PassageGenerationRequest = {
          documentType: "email",
          difficulty,
        }
        expect(request.difficulty).toBe(difficulty)
      }
    })
  })

  describe("GeneratedPassage", () => {
    it("should accept valid generated passage", () => {
      const passage: GeneratedPassage = {
        title: "Office Renovation Notice",
        content: "Dear employees, we are renovating...",
        documentType: "notice",
        difficulty: 3,
      }

      expect(passage.title).toBe("Office Renovation Notice")
      expect(passage.content).toContain("Dear employees")
      expect(passage.documentType).toBe("notice")
      expect(passage.difficulty).toBe(3)
    })
  })

  describe("QuestionGenerationRequest", () => {
    it("should accept valid question generation request", () => {
      const request: QuestionGenerationRequest = {
        passageId: "passage-123",
        passageContent: "The passage content...",
        passageTitle: "Test Passage",
        documentType: "email",
        questionCount: 4,
        questionTypes: ["main_idea", "detail", "inference"],
      }

      expect(request.passageId).toBe("passage-123")
      expect(request.questionCount).toBe(4)
      expect(request.questionTypes).toHaveLength(3)
    })

    it("should accept request without optional questionTypes", () => {
      const request: QuestionGenerationRequest = {
        passageId: "passage-123",
        passageContent: "Content",
        passageTitle: "Title",
        documentType: "article",
        questionCount: 3,
      }

      expect(request.questionTypes).toBeUndefined()
    })
  })

  describe("GeneratedQuestion", () => {
    it("should accept valid generated question", () => {
      const question: GeneratedQuestion = {
        questionText: "What is the main purpose of this email?",
        questionType: "main_idea",
        options: [
          "To announce a meeting",
          "To request vacation",
          "To report sales figures",
          "To introduce a new employee",
        ],
        correctAnswer: 0,
        explanation: "The email clearly states the purpose in the first paragraph.",
      }

      expect(question.questionText).toContain("main purpose")
      expect(question.questionType).toBe("main_idea")
      expect(question.options).toHaveLength(4)
      expect(question.correctAnswer).toBe(0)
      expect(question.explanation).toBeTruthy()
    })

    it("should accept all valid question types", () => {
      const questionTypes = ["main_idea", "detail", "inference", "vocabulary", "purpose"] as const

      for (const qType of questionTypes) {
        const question: GeneratedQuestion = {
          questionText: "Test question",
          questionType: qType,
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Explanation",
        }
        expect(question.questionType).toBe(qType)
      }
    })
  })

  describe("AIMetadata", () => {
    it("should accept valid AI metadata", () => {
      const metadata: AIMetadata = {
        model: "gpt-4-turbo-preview",
        generatedAt: "2024-01-15T10:30:00Z",
        prompt_tokens: 500,
        completion_tokens: 1000,
        total_tokens: 1500,
      }

      expect(metadata.model).toBe("gpt-4-turbo-preview")
      expect(metadata.total_tokens).toBe(1500)
    })

    it("should accept metadata without optional token counts", () => {
      const metadata: AIMetadata = {
        model: "gpt-4",
        generatedAt: "2024-01-15T10:30:00Z",
      }

      expect(metadata.prompt_tokens).toBeUndefined()
      expect(metadata.completion_tokens).toBeUndefined()
      expect(metadata.total_tokens).toBeUndefined()
    })
  })

  describe("GenerationResult", () => {
    it("should accept successful result with data", () => {
      const result: GenerationResult<GeneratedPassage> = {
        success: true,
        data: {
          title: "Test",
          content: "Content",
          documentType: "email",
          difficulty: 3,
        },
        metadata: {
          model: "gpt-4",
          generatedAt: "2024-01-15T10:30:00Z",
        },
      }

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it("should accept failed result with error", () => {
      const result: GenerationResult<GeneratedPassage> = {
        success: false,
        error: "API rate limit exceeded",
      }

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe("API rate limit exceeded")
    })
  })
})
