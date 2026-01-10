import { notFound } from "next/navigation"
import { getPassageWithQuestions } from "@/actions/reading"
import { canUseUsage } from "@/actions/usage"
import { QuestionView } from "@/components/reading/QuestionView"
import { UsageLimitBlock } from "@/components/subscription/UsageLimitBlock"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReadingDetailPage({ params }: Props) {
  const { id } = await params
  const passage = await getPassageWithQuestions(id)

  if (!passage) {
    notFound()
  }

  // 利用制限チェック
  const usageCheck = await canUseUsage("reading")

  // 制限に達している場合はブロック画面を表示
  if (!usageCheck.allowed) {
    return (
      <div className="space-y-6">
        <UsageLimitBlock
          featureType="reading"
          limit={usageCheck.limit ?? 0}
          title={passage.title}
          message={`本日の長文読解の利用制限（${usageCheck.limit}問）に達しました。`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{passage.title}</h1>
      <QuestionView passage={passage} />
    </div>
  )
}
