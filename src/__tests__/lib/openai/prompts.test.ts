import { describe, it, expect } from "vitest"
import { buildPassagePrompt, getSystemPromptForPassage } from "@/lib/openai/prompts/passage"
import { buildQuestionsPrompt, getSystemPromptForQuestions } from "@/lib/openai/prompts/questions"
import type { PassageGenerationRequest, QuestionGenerationRequest } from "@/types/ai-generation"

describe("Passage Prompts", () => {
  describe("buildPassagePrompt", () => {
    it("should build prompt for email document type", () => {
      const request: PassageGenerationRequest = {
        documentType: "email",
        difficulty: 3,
      }

      const prompt = buildPassagePrompt(request)

      expect(prompt).toContain("Document Type: email")
      expect(prompt).toContain("Difficulty Level: 3/5")
      expect(prompt).toContain("From/To/Subject headers")
      expect(prompt).toContain("Intermediate level")
      expect(prompt).toContain("JSON")
    })

    it("should include topic when provided", () => {
      const request: PassageGenerationRequest = {
        documentType: "article",
        difficulty: 4,
        topic: "New product launch",
      }

      const prompt = buildPassagePrompt(request)

      expect(prompt).toContain("Topic/Theme: New product launch")
    })

    it("should use default topic instruction when not provided", () => {
      const request: PassageGenerationRequest = {
        documentType: "notice",
        difficulty: 2,
      }

      const prompt = buildPassagePrompt(request)

      expect(prompt).toContain("Topic: Choose an appropriate business-related topic")
    })

    it("should include all document type guidelines", () => {
      const documentTypes = ["email", "article", "notice", "advertisement", "letter", "chat", "form", "review"] as const

      for (const docType of documentTypes) {
        const request: PassageGenerationRequest = {
          documentType: docType,
          difficulty: 3,
        }

        const prompt = buildPassagePrompt(request)
        expect(prompt).toContain(`Document Type: ${docType}`)
      }
    })

    it("should include all difficulty levels", () => {
      const difficulties = [1, 2, 3, 4, 5] as const

      for (const difficulty of difficulties) {
        const request: PassageGenerationRequest = {
          documentType: "email",
          difficulty,
        }

        const prompt = buildPassagePrompt(request)
        expect(prompt).toContain(`Difficulty Level: ${difficulty}/5`)
      }
    })
  })

  describe("getSystemPromptForPassage", () => {
    it("should return system prompt for passage generation", () => {
      const systemPrompt = getSystemPromptForPassage()

      expect(systemPrompt).toContain("TOEIC")
      expect(systemPrompt).toContain("business English")
    })
  })
})

describe("Questions Prompts", () => {
  describe("buildQuestionsPrompt", () => {
    it("should build prompt with passage information", () => {
      const request: QuestionGenerationRequest = {
        passageId: "test-id",
        passageTitle: "Test Passage",
        passageContent: "This is the test content of the passage.",
        documentType: "email",
        questionCount: 4,
      }

      const prompt = buildQuestionsPrompt(request)

      expect(prompt).toContain("Passage Title: Test Passage")
      expect(prompt).toContain("Document Type: email")
      expect(prompt).toContain("This is the test content of the passage.")
      expect(prompt).toContain("Generate 4 questions")
    })

    it("should include all question type guidelines when not specified", () => {
      const request: QuestionGenerationRequest = {
        passageId: "test-id",
        passageTitle: "Test",
        passageContent: "Content",
        documentType: "article",
        questionCount: 3,
      }

      const prompt = buildQuestionsPrompt(request)

      expect(prompt).toContain("main_idea")
      expect(prompt).toContain("detail")
      expect(prompt).toContain("inference")
      expect(prompt).toContain("vocabulary")
      expect(prompt).toContain("purpose")
    })

    it("should include only specified question types", () => {
      const request: QuestionGenerationRequest = {
        passageId: "test-id",
        passageTitle: "Test",
        passageContent: "Content",
        documentType: "notice",
        questionCount: 2,
        questionTypes: ["main_idea", "detail"],
      }

      const prompt = buildQuestionsPrompt(request)

      expect(prompt).toContain("main_idea")
      expect(prompt).toContain("detail")
      // Should include guidelines for specified types
      expect(prompt).toContain("Main Idea / Purpose Question")
      expect(prompt).toContain("Detail Question")
    })

    it("should include JSON output format instructions", () => {
      const request: QuestionGenerationRequest = {
        passageId: "test-id",
        passageTitle: "Test",
        passageContent: "Content",
        documentType: "email",
        questionCount: 4,
      }

      const prompt = buildQuestionsPrompt(request)

      expect(prompt).toContain("JSON array")
      expect(prompt).toContain("questionText")
      expect(prompt).toContain("questionType")
      expect(prompt).toContain("options")
      expect(prompt).toContain("correctAnswer")
      expect(prompt).toContain("explanation")
    })
  })

  describe("getSystemPromptForQuestions", () => {
    it("should return system prompt for questions generation", () => {
      const systemPrompt = getSystemPromptForQuestions()

      expect(systemPrompt).toContain("TOEIC")
      expect(systemPrompt).toContain("Part 7")
      expect(systemPrompt).toContain("reading comprehension")
    })
  })
})
