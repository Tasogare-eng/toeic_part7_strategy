export const APP_NAME = "TOEIC Part7 Training"

export const DOCUMENT_TYPES = {
  email: "Email",
  article: "Article",
  notice: "Notice",
  advertisement: "Advertisement",
  letter: "Letter",
  chat: "Chat",
  form: "Form",
  review: "Review",
} as const

export const QUESTION_TYPES = {
  main_idea: "主旨把握",
  detail: "詳細理解",
  inference: "推測",
  vocabulary: "語彙",
  purpose: "目的",
} as const

export const DIFFICULTY_LABELS = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"]
