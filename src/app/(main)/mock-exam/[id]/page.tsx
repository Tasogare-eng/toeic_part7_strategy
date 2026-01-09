import { redirect, notFound } from "next/navigation"
import { getMockExam, getMockExamQuestions, getMockExamAnswers } from "@/actions/mock-exam"
import { MockExamSession } from "@/components/mock-exam/MockExamSession"

interface Props {
  params: Promise<{ id: string }>
}

export default async function MockExamSessionPage({ params }: Props) {
  const { id } = await params

  const [exam, questions, answers] = await Promise.all([
    getMockExam(id),
    getMockExamQuestions(id),
    getMockExamAnswers(id),
  ])

  if (!exam) {
    notFound()
  }

  // 完了済みの場合は結果ページへリダイレクト
  if (exam.status === "completed") {
    redirect(`/mock-exam/${id}/result`)
  }

  // 中断済みの場合は模試一覧へリダイレクト
  if (exam.status === "abandoned") {
    redirect("/mock-exam")
  }

  // 既存の回答をマップに変換
  const initialAnswers: Record<string, string> = {}
  for (const answer of answers) {
    if (answer.selected_answer) {
      initialAnswers[answer.mock_question_id] = answer.selected_answer
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <MockExamSession
        exam={exam}
        questions={questions}
        initialAnswers={initialAnswers}
      />
    </div>
  )
}
