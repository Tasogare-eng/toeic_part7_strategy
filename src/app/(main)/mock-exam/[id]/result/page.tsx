import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MockExamResult } from "@/components/mock-exam/MockExamResult"
import { getMockExamResult } from "@/actions/mock-exam"
import { ArrowLeft, RotateCcw } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function MockExamResultPage({ params }: Props) {
  const { id } = await params
  const result = await getMockExamResult(id)

  if (!result) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/mock-exam">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            模試一覧へ
          </Button>
        </Link>
        <Link href="/mock-exam">
          <Button>
            <RotateCcw className="mr-2 h-4 w-4" />
            もう一度受ける
          </Button>
        </Link>
      </div>

      <MockExamResult result={result} />
    </div>
  )
}
