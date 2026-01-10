"use client"

import { useState } from "react"
import { Invoice } from "@/types/subscription"
import { getInvoiceUrl } from "@/actions/billing"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Loader2, Receipt } from "lucide-react"

interface InvoiceListProps {
  invoices: Invoice[]
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return (
        <Badge variant="default" className="bg-green-600">
          支払い済み
        </Badge>
      )
    case "open":
      return <Badge variant="secondary">未払い</Badge>
    case "void":
      return <Badge variant="outline">無効</Badge>
    case "uncollectible":
      return <Badge variant="destructive">回収不能</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [loading, setLoading] = useState(false)

  const handleViewInvoice = async () => {
    setLoading(true)
    try {
      const result = await getInvoiceUrl(invoice.stripeInvoiceId)
      if ("url" in result) {
        window.open(result.url, "_blank", "noopener,noreferrer")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <TableRow>
      <TableCell>{formatDate(invoice.paidAt || invoice.createdAt)}</TableCell>
      <TableCell className="font-medium">
        {formatAmount(invoice.amountPaid, invoice.currency)}
      </TableCell>
      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewInvoice}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-1" />
              領収書
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>まだ請求履歴がありません</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>請求日</TableHead>
          <TableHead>金額</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead className="text-right">領収書</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </TableBody>
    </Table>
  )
}
