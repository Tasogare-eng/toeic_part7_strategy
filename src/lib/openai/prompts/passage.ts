import type { DocumentType } from "@/types/database"
import type { PassageGenerationRequest } from "@/types/ai-generation"

const DOCUMENT_TYPE_GUIDELINES: Record<DocumentType, string> = {
  email: `Business email format with:
- From/To/Subject headers
- Professional greeting and closing
- Clear purpose in the first paragraph
- Action items or requests
- Signature with name and title`,

  article: `News article or magazine format with:
- Compelling headline implied by title
- Location and date reference in opening
- Quote from a relevant person
- Facts and statistics
- Conclusion with future outlook`,

  notice: `Official notice or announcement with:
- Organization name header
- "NOTICE" or "ANNOUNCEMENT" heading
- Effective date clearly stated
- Bullet points for key information
- Contact information for questions`,

  advertisement: `Product or service advertisement with:
- Attention-grabbing headline
- Product/service benefits
- Special offers or discounts
- Call to action
- Contact or ordering information`,

  letter: `Formal business letter with:
- Date and recipient address
- Formal salutation
- Body paragraphs with clear purpose
- Formal closing
- Sender signature block`,

  chat: `Online chat or messaging format with:
- Multiple participants
- Timestamps
- Informal language
- Back-and-forth conversation
- Emojis or abbreviations (sparingly)`,

  form: `Application or registration form with:
- Form title
- Instruction section
- Multiple fields with labels
- Requirements or eligibility
- Submission deadline`,

  review: `Product or service review with:
- Star rating or score
- Reviewer information
- Pros and cons
- Detailed experience description
- Recommendation statement`
}

const DIFFICULTY_GUIDELINES: Record<number, string> = {
  1: `Beginner level (TOEIC 400-500):
- Simple vocabulary (everyday words)
- Short sentences (10-15 words average)
- Basic grammar structures
- Total length: 100-150 words
- Clear, straightforward meaning`,

  2: `Elementary level (TOEIC 500-600):
- Common business vocabulary
- Moderate sentence length (15-20 words)
- Some compound sentences
- Total length: 150-200 words
- Mostly literal meaning`,

  3: `Intermediate level (TOEIC 600-700):
- Standard business vocabulary
- Varied sentence structures
- Some idiomatic expressions
- Total length: 200-250 words
- Some implied information`,

  4: `Upper-intermediate level (TOEIC 700-800):
- Advanced business vocabulary
- Complex sentence structures
- Idiomatic expressions
- Total length: 250-300 words
- Requires inference skills`,

  5: `Advanced level (TOEIC 800-900):
- Sophisticated vocabulary
- Complex grammar and syntax
- Nuanced expressions
- Total length: 300-350 words
- Heavy inference required`
}

export function buildPassagePrompt(request: PassageGenerationRequest): string {
  const documentGuide = DOCUMENT_TYPE_GUIDELINES[request.documentType]
  const difficultyGuide = DIFFICULTY_GUIDELINES[request.difficulty]
  const topicInstruction = request.topic
    ? `Topic/Theme: ${request.topic}`
    : "Topic: Choose an appropriate business-related topic"

  return `You are an expert TOEIC test creator. Generate a reading passage for TOEIC Part 7.

## Document Type: ${request.documentType}
${documentGuide}

## Difficulty Level: ${request.difficulty}/5
${difficultyGuide}

## ${topicInstruction}

## Requirements:
1. Content must be realistic and business-appropriate
2. Include specific details (names, dates, numbers) that can be asked about
3. Include information that requires inference
4. Avoid cultural bias or controversial topics
5. Use American English spelling and conventions

## Output Format:
Return a JSON object with the following structure:
{
  "title": "A short, descriptive title for the passage",
  "content": "The full passage text with proper formatting"
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.`
}

export function getSystemPromptForPassage(): string {
  return `You are a professional TOEIC test content creator with expertise in creating authentic business English reading materials. Your passages should:
- Be indistinguishable from real TOEIC test materials
- Include testable content (specific facts, implied information, vocabulary in context)
- Be appropriate for adult learners in a business context
- Follow the exact format specifications provided`
}
