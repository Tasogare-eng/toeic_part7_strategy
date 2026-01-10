import { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "決済完了 | TOEIC Part7 トレーニング",
}

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">お支払いが完了しました</CardTitle>
          <CardDescription>
            Pro プランへのご加入ありがとうございます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            すべての機能がご利用いただけるようになりました。
            さっそく学習を始めましょう。
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/subscription">サブスクリプション管理</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
