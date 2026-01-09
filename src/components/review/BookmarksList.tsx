"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bookmark,
  BookOpen,
  Languages,
  FileQuestion,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { removeBookmark } from "@/actions/review"
import type { Bookmark as BookmarkType } from "@/types/review"
import { REVIEW_ITEM_TYPE_LABELS, ReviewItemType } from "@/types/review"
import { toast } from "sonner"

interface BookmarksListProps {
  bookmarks: BookmarkType[]
}

export function BookmarksList({ bookmarks }: BookmarksListProps) {
  const [localBookmarks, setLocalBookmarks] = useState(bookmarks)
  const [isPending, startTransition] = useTransition()

  const handleRemove = (bookmark: BookmarkType) => {
    startTransition(async () => {
      try {
        await removeBookmark(bookmark.item_type, bookmark.item_id)
        setLocalBookmarks((prev) =>
          prev.filter((b) => b.id !== bookmark.id)
        )
        toast.success("ブックマークを解除しました")
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

  const getLink = (bookmark: BookmarkType) => {
    switch (bookmark.item_type) {
      case "vocabulary":
        return `/vocabulary`
      case "grammar":
        return `/grammar`
      case "reading":
        return `/reading`
    }
  }

  const vocabularyBookmarks = localBookmarks.filter(
    (b) => b.item_type === "vocabulary"
  )
  const grammarBookmarks = localBookmarks.filter(
    (b) => b.item_type === "grammar"
  )
  const readingBookmarks = localBookmarks.filter(
    (b) => b.item_type === "reading"
  )

  if (localBookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>ブックマークがありません</p>
          <p className="text-sm mt-1">
            学習中に気になる問題をブックマークに追加しましょう
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderBookmarkItem = (bookmark: BookmarkType) => (
    <div
      key={bookmark.id}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-full">
          {getIcon(bookmark.item_type)}
        </div>
        <div>
          <Badge variant="secondary" className="text-xs">
            {REVIEW_ITEM_TYPE_LABELS[bookmark.item_type]}
          </Badge>
          {bookmark.note && (
            <p className="text-sm text-gray-500 mt-1">{bookmark.note}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(bookmark.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href={getLink(bookmark)}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemove(bookmark)}
          disabled={isPending}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-yellow-500" />
          ブックマーク
          <span className="text-sm font-normal text-muted-foreground">
            ({localBookmarks.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              すべて ({localBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="vocabulary">
              単語 ({vocabularyBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="grammar">
              文法 ({grammarBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="reading">
              長文 ({readingBookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {localBookmarks.map(renderBookmarkItem)}
          </TabsContent>
          <TabsContent value="vocabulary" className="space-y-2">
            {vocabularyBookmarks.length > 0 ? (
              vocabularyBookmarks.map(renderBookmarkItem)
            ) : (
              <p className="text-center text-gray-500 py-4">
                単語のブックマークはありません
              </p>
            )}
          </TabsContent>
          <TabsContent value="grammar" className="space-y-2">
            {grammarBookmarks.length > 0 ? (
              grammarBookmarks.map(renderBookmarkItem)
            ) : (
              <p className="text-center text-gray-500 py-4">
                文法のブックマークはありません
              </p>
            )}
          </TabsContent>
          <TabsContent value="reading" className="space-y-2">
            {readingBookmarks.length > 0 ? (
              readingBookmarks.map(renderBookmarkItem)
            ) : (
              <p className="text-center text-gray-500 py-4">
                長文のブックマークはありません
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
