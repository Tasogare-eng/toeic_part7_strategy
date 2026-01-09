"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { addBookmark, removeBookmark } from "@/actions/review"
import type { ReviewItemType } from "@/types/review"
import { toast } from "sonner"

interface BookmarkButtonProps {
  itemType: ReviewItemType
  itemId: string
  isBookmarked: boolean
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
  className?: string
}

export function BookmarkButton({
  itemType,
  itemId,
  isBookmarked: initialBookmarked,
  variant = "ghost",
  size = "icon",
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      try {
        if (isBookmarked) {
          await removeBookmark(itemType, itemId)
          setIsBookmarked(false)
          toast.success("ブックマークを解除しました")
        } else {
          await addBookmark(itemType, itemId)
          setIsBookmarked(true)
          toast.success("ブックマークに追加しました")
        }
      } catch (error) {
        console.error("Bookmark toggle failed:", error)
        toast.error("ブックマークの更新に失敗しました")
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isPending}
      className={`
        transition-colors
        ${isBookmarked ? "text-yellow-500 hover:text-yellow-600" : "text-gray-400 hover:text-gray-600"}
        ${className}
      `}
      title={isBookmarked ? "ブックマークを解除" : "ブックマークに追加"}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="h-5 w-5" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isBookmarked ? "ブックマーク済み" : "ブックマーク"}
        </span>
      )}
    </Button>
  )
}
