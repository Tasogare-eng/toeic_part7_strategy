"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

interface UsageLimitModalProps {
  open: boolean
  onClose: () => void
  featureType: "reading" | "grammar" | "vocabulary"
  limit: number
}

const FEATURE_LABELS: Record<string, string> = {
  reading: "長文読解",
  grammar: "文法問題",
  vocabulary: "単語学習",
}

export function UsageLimitModal({
  open,
  onClose,
  featureType,
  limit,
}: UsageLimitModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            本日の利用上限に達しました
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                無料プランでは{FEATURE_LABELS[featureType]}は1日{limit}
                回までです。
              </p>
              <p>Pro プランにアップグレードすると、制限なしで学習できます。</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
          <Link href="/pricing">
            <Button>Pro にアップグレード</Button>
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
