import OpenAI from "openai"

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables")
    }

    openaiClient = new OpenAI({
      apiKey,
    })
  }

  return openaiClient
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4-turbo-preview"
}

export function getMaxTokens(): number {
  const maxTokens = process.env.OPENAI_MAX_TOKENS
  return maxTokens ? parseInt(maxTokens, 10) : 4000
}
