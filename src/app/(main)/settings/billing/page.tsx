import { Metadata } from "next"
import { getInvoices } from "@/actions/billing"
import { createPortalSession } from "@/actions/subscription"
import { InvoiceList } from "@/components/billing/InvoiceList"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "請求履歴 | TOEIC Part7 トレーニング",
}

async function handlePortalRedirect() {
  "use server"
  const result = await createPortalSession()
  if ("url" in result) {
    redirect(result.url)
  }
}

export default async function BillingPage() {
  const invoices = await getInvoices()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">請求履歴</h1>
        <p className="text-muted-foreground">
          過去の請求と領収書を確認できます
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>請求履歴</CardTitle>
          <CardDescription>
            過去12件の請求履歴を表示しています
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceList invoices={invoices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>すべての請求履歴</CardTitle>
          <CardDescription>
            Stripeのカスタマーポータルで詳細な請求履歴を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handlePortalRedirect}>
            <Button variant="outline" type="submit">
              <ExternalLink className="h-4 w-4 mr-2" />
              Stripeで確認する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
