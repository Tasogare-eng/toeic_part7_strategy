import { redirect } from "next/navigation"
import {
  getVocabulary,
  getTodayReviewVocabulary,
  getUnlearnedVocabulary,
} from "@/actions/vocabulary"
import { FlashCardSession } from "@/components/vocabulary/FlashCardSession"
import { VocabularyLevel, VocabularyCategory } from "@/types/vocabulary"

interface Props {
  searchParams: Promise<{
    level?: string
    category?: string
    mode?: string
    count?: string
  }>
}

export default async function FlashCardPage({ searchParams }: Props) {
  const params = await searchParams
  const level = params.level
    ? (parseInt(params.level) as VocabularyLevel)
    : undefined
  const category = params.category as VocabularyCategory | undefined
  const mode = params.mode || "new" // "new" | "review" | "all"
  const count = params.count ? parseInt(params.count) : 20

  let vocabularies

  if (mode === "review") {
    // 復習モード: 復習が必要な単語を取得
    vocabularies = await getTodayReviewVocabulary()
  } else if (mode === "new") {
    // 新規学習モード: 未学習の単語を取得
    vocabularies = await getUnlearnedVocabulary({
      level,
      category,
      limit: count,
    })
    // 未学習がない場合は全体から取得
    if (vocabularies.length === 0) {
      const allVocab = await getVocabulary({
        level,
        category,
        limit: count,
      })
      vocabularies = allVocab
    }
  } else {
    // 全体モード: 条件に合う単語を取得
    vocabularies = await getVocabulary({
      level,
      category,
      limit: count,
    })
  }

  // シャッフル
  const shuffled = [...vocabularies].sort(() => Math.random() - 0.5)

  return (
    <div className="container mx-auto py-6">
      <FlashCardSession vocabularies={shuffled} />
    </div>
  )
}
