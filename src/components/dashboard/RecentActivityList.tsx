import { DOCUMENT_TYPES } from "@/lib/constants"
import type { RecentActivity } from "@/actions/progress"

interface RecentActivityListProps {
  activities: RecentActivity[]
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">まだ学習履歴がありません</p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const accuracy = Math.round(
          (activity.correctCount / activity.answeredCount) * 100
        )
        return (
          <div
            key={activity.passageId}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div>
              <p className="font-medium">{activity.passageTitle}</p>
              <p className="text-sm text-muted-foreground">
                {DOCUMENT_TYPES[activity.documentType as keyof typeof DOCUMENT_TYPES]}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">
                {activity.correctCount}/{activity.answeredCount}問正解
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
