import type { QuestionType } from "@/types/database"
import type { QuestionGenerationRequest } from "@/types/ai-generation"

const QUESTION_TYPE_GUIDELINES: Record<QuestionType, string> = {
  main_idea: `Main Idea / Purpose Question:
- Ask about the overall purpose or main topic of the passage
- Common patterns:
  - "What is the main purpose of this [document type]?"
  - "What is the [document] mainly about?"
  - "Why was this [document] written?"
- Correct answer summarizes the central theme
- Distractors mention specific details or are too narrow/broad`,

  detail: `Detail Question:
- Ask about specific facts explicitly stated in the passage
- Common patterns:
  - "According to the passage, what..."
  - "What is mentioned about..."
  - "When/Where/How much..."
- Correct answer paraphrases information from the text
- Distractors use similar words but with incorrect information`,

  inference: `Inference Question:
- Ask about information that is implied but not directly stated
- Common patterns:
  - "What can be inferred about..."
  - "What is probably true about..."
  - "What is suggested about..."
- Correct answer requires connecting multiple pieces of information
- Distractors are either stated explicitly or are unsupported assumptions`,

  vocabulary: `Vocabulary in Context Question:
- Ask about the meaning of a word or phrase as used in the passage
- Common patterns:
  - "The word '...' in line X is closest in meaning to"
  - "What does '...' most likely mean?"
- Choose words with multiple meanings where context determines usage
- Correct answer fits the specific context
- Distractors are other valid meanings of the word`,

  purpose: `Purpose / Intent Question:
- Ask why the author wrote something or what effect they intended
- Common patterns:
  - "Why does the author mention...?"
  - "What is the purpose of paragraph X?"
  - "Why is [specific detail] included?"
- Correct answer explains the rhetorical function
- Distractors misinterpret the author's intent`
}

export function buildQuestionsPrompt(request: QuestionGenerationRequest): string {
  const questionTypesInstructions = request.questionTypes
    ? request.questionTypes.map(qt => `- ${qt}: ${QUESTION_TYPE_GUIDELINES[qt]}`).join("\n\n")
    : Object.entries(QUESTION_TYPE_GUIDELINES)
        .map(([type, guide]) => `- ${type}: ${guide}`)
        .join("\n\n")

  return `You are an expert TOEIC test creator. Generate ${request.questionCount} questions for the following passage.

## Passage Title: ${request.passageTitle}
## Document Type: ${request.documentType}

## Passage Content:
${request.passageContent}

## Question Type Guidelines:
${questionTypesInstructions}

## Requirements:
1. Each question must have exactly 4 options (A, B, C, D)
2. Only one option should be clearly correct
3. Distractors should be plausible but definitively wrong
4. Questions should test different skills (comprehension, inference, vocabulary)
5. Distribute question types appropriately:
   - Include at least 1 main_idea or purpose question
   - Include at least 1-2 detail questions
   - Include inference and vocabulary questions as appropriate
6. Questions should progress from easier to harder
7. Provide a clear explanation for each correct answer

## Output Format:
Return a JSON object with the following structure:
{
  "questions": [
    {
      "questionText": "The question text",
      "questionType": "main_idea|detail|inference|vocabulary|purpose",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why the correct answer is correct and others are wrong"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object with a "questions" array. No additional text.`
}

export function getSystemPromptForQuestions(): string {
  return `You are a professional TOEIC test content creator specializing in reading comprehension questions. Your questions should:
- Match the authentic TOEIC Part 7 format exactly
- Test genuine comprehension, not just word matching
- Have clear, unambiguous correct answers
- Include plausible but incorrect distractors
- Cover different question types to assess various reading skills
- Be appropriate for the difficulty level of the passage`
}
