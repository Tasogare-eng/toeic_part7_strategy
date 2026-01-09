"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle,
  Languages,
  FileQuestion,
  BookOpen,
  ExternalLink,
} from "lucide-react"
import { completeReviewItem } from "@/actions/review"
import type { ReviewScheduleItem } from "@/types/review"
import {
  REVIEW_ITEM_TYPE_LABELS,
  PRIORITY_LABELS,
  ReviewItemType,
} from "@/types/review"
import { toast } from "sonner"

interface ReviewScheduleListProps {
  scheduleItems: ReviewScheduleItem[]
}

export function ReviewScheduleList({
  scheduleItems,
}: ReviewScheduleListProps) {
  const [localItems, setLocalItems] = useState(scheduleItems)
  const [isPending, startTransition] = useTransition()

  const handleComplete = (item: ReviewScheduleItem) => {
    startTransition(async () => {
      try {
        await completeReviewItem(item.id)
        setLocalItems((prev) => prev.filter((i) => i.id !== item.id))
        toast.success("復習を完了しました")
      } catch (error) {
        toast.error("エラーが発生しました")
      }
    })
  }

  const getIcon = (type: ReviewItemType) => {
    switch (type) {
      case "vocabulary":
        return <Languages className="h-4 w-4" />
      case "grammar":
        return <FileQuestion className="h-4 w-4" />
      case "reading":
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: 1 | 2 | 3) => {
    switch (priority) {
      case 3:
        return "bg-red-100 text-red-700"
      case 2:
        return "bg-yellow-100 text-yellow-700"
      case 1:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getLink = (item: ReviewScheduleItem) => {
    switch (item.item_type) {
      case "vocabulary":
        return `/vocabulary/flashcard?mode=review`
      case "grammar":
        return `/grammar/practice?mode=review`
      case "reading":
        return `/reading`
    }
  }

  if (localItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
          <p>今日の復習はすべて完了しました！</p>
          <p className="text-sm mt-1">素晴らしい！この調子で頑張りましょう</p>
        </CardContent>
      </Card>
    )
  }

  // Sort by priority (high first) and date
  const sortedItems = [...localItems].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    return (
      new Date(a.scheduled_date).getTime() -
      new Date(b.scheduled_date).getTime()
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          今日の復習
          <span className="text-sm font-normal text-muted-foreground">
            ({localItems.length}件)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  {getIcon(item.item_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {REVIEW_ITEM_TYPE_LABELS[item.item_type]}
                    </Badge>
                    <Badge
                      className={`text-xs ${getPriorityColor(item.priority as 1 | 2 | 3)}`}
                    >
                      {PRIORITY_LABELS[item.priority as 1 | 2 | 3]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    予定日:{" "}
                    {new Date(item.scheduled_date).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={getLink(item)}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    学習する
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleComplete(item)}
                  disabled={isPending}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  完了
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
