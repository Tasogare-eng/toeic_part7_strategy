import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle } from "lucide-react"
import type { WeakAreas } from "@/actions/analytics"

interface Props {
  weakAreas: WeakAreas
}

const LABEL_MAP: Record<string, string> = {
  // Document types
  email: "メール",
  article: "記事",
  notice: "お知らせ",
  advertisement: "広告",
  letter: "手紙",
  chat: "チャット",
  form: "フォーム",
  review: "レビュー",
  // Question types
  main_idea: "主旨把握",
  detail: "詳細理解",
  inference: "推測",
  vocabulary: "語彙",
  purpose: "目的"
}

export function WeakAreasCard({ weakAreas }: Props) {
  const hasWeakness = weakAreas.documentTypes.length > 0 || weakAreas.questionTypes.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasWeakness ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          弱点分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasWeakness ? (
          <p className="text-muted-foreground">
            正答率70%未満の苦手分野はありません。この調子で頑張りましょう！
          </p>
        ) : (
          <div className="space-y-6">
            {weakAreas.documentTypes.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">苦手な文書タイプ</h4>
                <ul className="space-y-2">
                  {weakAreas.documentTypes.map(d => (
                    <li
                      key={d.document_type}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-md"
                    >
                      <span className="font-medium">
                        {LABEL_MAP[d.document_type] || d.document_type}
                      </span>
                      <div className="text-right">
                        <span className="text-red-600 font-bold">{d.accuracy}%</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({d.questions_answered}問)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weakAreas.questionTypes.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">苦手な設問タイプ</h4>
                <ul className="space-y-2">
                  {weakAreas.questionTypes.map(q => (
                    <li
                      key={q.question_type}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-md"
                    >
                      <span className="font-medium">
                        {LABEL_MAP[q.question_type] || q.question_type}
                      </span>
                      <div className="text-right">
                        <span className="text-red-600 font-bold">{q.accuracy}%</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({q.questions_answered}問)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              ※ 3問以上回答し、正答率70%未満のカテゴリを表示しています
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
