import { Metadata } from "next"
import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "決済キャンセル | TOEIC Part7 トレーニング",
}

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">決済がキャンセルされました</CardTitle>
          <CardDescription>お支払いは完了していません</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            決済を完了するには、もう一度お試しください。
            ご不明な点がございましたらお問い合わせください。
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/pricing">料金プランに戻る</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
