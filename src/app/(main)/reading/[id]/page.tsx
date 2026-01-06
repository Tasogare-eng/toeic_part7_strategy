import { notFound } from "next/navigation"
import { getPassageWithQuestions } from "@/actions/reading"
import { QuestionView } from "@/components/reading/QuestionView"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReadingDetailPage({ params }: Props) {
  const { id } = await params
  const passage = await getPassageWithQuestions(id)

  if (!passage) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{passage.title}</h1>
      <QuestionView passage={passage} />
    </div>
  )
}
