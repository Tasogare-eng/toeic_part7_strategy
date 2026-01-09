import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MockExamHistory } from "@/components/mock-exam/MockExamHistory"
import { getMockExamResults } from "@/actions/mock-exam"
import { ArrowLeft } from "lucide-react"

export default async function MockExamHistoryPage() {
  const results = await getMockExamResults()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mock-exam">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">模試履歴</h1>
          <p className="text-muted-foreground">
            過去の模試結果を確認できます
          </p>
        </div>
      </div>

      <MockExamHistory results={results} />
    </div>
  )
}
