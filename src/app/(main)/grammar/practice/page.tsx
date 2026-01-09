import {
  getRandomGrammarQuestions,
  getIncorrectGrammarQuestions,
} from "@/actions/grammar"
import { GrammarPracticeSession } from "@/components/grammar/GrammarPracticeSession"
import { GrammarCategory } from "@/types/grammar"

interface Props {
  searchParams: Promise<{
    category?: string
    difficulty?: string
    count?: string
    mode?: string
  }>
}

export default async function GrammarPracticePage({ searchParams }: Props) {
  const params = await searchParams
  const category = params.category as GrammarCategory | undefined
  const difficulty = params.difficulty
    ? parseInt(params.difficulty)
    : undefined
  const count = params.count ? parseInt(params.count) : 10
  const mode = params.mode || "random" // "random" | "review"

  let questions

  if (mode === "review") {
    // 復習モード: 間違えた問題を取得
    questions = await getIncorrectGrammarQuestions(count)
  } else {
    // ランダムモード
    questions = await getRandomGrammarQuestions(count, {
      category,
      difficulty,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <GrammarPracticeSession questions={questions} />
    </div>
  )
}
