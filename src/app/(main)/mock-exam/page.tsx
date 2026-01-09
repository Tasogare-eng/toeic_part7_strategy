import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MockExamSelector } from "@/components/mock-exam/MockExamSelector"
import { MockExamHistory } from "@/components/mock-exam/MockExamHistory"
import { getInProgressMockExam, getMockExamResults } from "@/actions/mock-exam"
import { AlertCircle, History } from "lucide-react"

export default async function MockExamPage() {
  const [inProgressExam, results] = await Promise.all([
    getInProgressMockExam(),
    getMockExamResults(),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模試</h1>
          <p className="text-muted-foreground">
            本番形式で実力をチェックしましょう
          </p>
        </div>
        <Link href="/mock-exam/history">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            履歴
          </Button>
        </Link>
      </div>

      {/* 進行中の模試がある場合 */}
      {inProgressExam && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                進行中の模試があります
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                開始日時:{" "}
                {new Date(inProgressExam.started_at).toLocaleString("ja-JP")}
              </p>
            </div>
            <Link href={`/mock-exam/${inProgressExam.id}`}>
              <Button size="sm">続ける</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 模試選択 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">新しい模試を開始</h2>
        <MockExamSelector />
      </section>

      {/* 最近の結果 */}
      {results.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">最近の結果</h2>
          <MockExamHistory results={results.slice(0, 3)} />
          {results.length > 3 && (
            <div className="mt-4 text-center">
              <Link href="/mock-exam/history">
                <Button variant="link">すべての履歴を見る</Button>
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
