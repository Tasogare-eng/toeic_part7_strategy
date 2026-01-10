import {
  getRandomGrammarQuestions,
  getIncorrectGrammarQuestions,
} from "@/actions/grammar"
import { canUseUsage } from "@/actions/usage"
import { GrammarPracticeSession } from "@/components/grammar/GrammarPracticeSession"
import { UsageLimitBlock } from "@/components/subscription/UsageLimitBlock"
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

  // 利用制限チェック
  const usageCheck = await canUseUsage("grammar")

  // 制限に達している場合はブロック画面を表示
  if (!usageCheck.allowed) {
    return (
      <div className="container mx-auto py-6">
        <UsageLimitBlock
          featureType="grammar"
          limit={usageCheck.limit ?? 0}
          title="文法練習"
          message={`本日の文法問題の利用制限（${usageCheck.limit}問）に達しました。`}
        />
      </div>
    )
  }

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
