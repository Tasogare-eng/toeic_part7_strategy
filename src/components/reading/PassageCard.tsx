import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DOCUMENT_TYPES, DIFFICULTY_LABELS } from "@/lib/constants"
import type { PassageWithProgress } from "@/types/database"

interface PassageCardProps {
  passage: PassageWithProgress
}

export function PassageCard({ passage }: PassageCardProps) {
  const progress = passage.user_progress
  const hasAnswered = progress && progress.answered_count > 0
  const accuracy = hasAnswered
    ? Math.round((progress.correct_count / progress.answered_count) * 100)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{getDocumentIcon(passage.document_type)}</span>
          <span>{passage.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {DOCUMENT_TYPES[passage.document_type]}
            </p>
            <p className="text-sm">
              難易度: {DIFFICULTY_LABELS[passage.difficulty]} | 問題数: {passage.question_count}問
            </p>
            {hasAnswered && (
              <p className="text-sm text-green-600">
                正答率: {accuracy}% ({progress.correct_count}/{progress.answered_count})
              </p>
            )}
          </div>
          <Link href={`/reading/${passage.id}`}>
            <Button variant={hasAnswered ? "outline" : "default"}>
              {hasAnswered ? "再挑戦" : "開始"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function getDocumentIcon(type: string): string {
  const icons: Record<string, string> = {
    email: "📧",
    article: "📰",
    notice: "📋",
    advertisement: "📢",
    letter: "✉️",
    chat: "💬",
    form: "📝",
    review: "⭐",
  }
  return icons[type] || "📄"
}
