"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Subscription } from "@/types/subscription"
import {
  createPortalSession,
  cancelSubscription,
  reactivateSubscription,
  createCheckoutSession,
} from "@/actions/subscription"
import { ExternalLink } from "lucide-react"

interface ManageSubscriptionProps {
  subscription: Subscription | null
}

export function ManageSubscription({ subscription }: ManageSubscriptionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isPro =
    subscription?.planType === "pro" && subscription?.status === "active"
  const isCanceling = subscription?.cancelAtPeriodEnd

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const result = await createCheckoutSession()
      if ("url" in result) {
        window.location.href = result.url
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManagePayment = async () => {
    setLoading(true)
    try {
      const result = await createPortalSession()
      if ("url" in result) {
        window.location.href = result.url
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      const result = await cancelSubscription()
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setLoading(true)
    try {
      const result = await reactivateSubscription()
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pro プランにアップグレード</CardTitle>
          <CardDescription>
            全機能を解放して、効率的に学習を進めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading ? "処理中..." : "Pro プランに加入"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 支払い方法管理 */}
      <Card>
        <CardHeader>
          <CardTitle>お支払い方法</CardTitle>
          <CardDescription>Stripeで支払い方法を管理できます</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleManagePayment}
            disabled={loading}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Stripeで管理
          </Button>
        </CardContent>
      </Card>

      {/* 解約管理 */}
      <Card>
        <CardHeader>
          <CardTitle>サブスクリプションの解約</CardTitle>
          <CardDescription>
            {isCanceling
              ? "解約予定です。期間終了後に無料プランに移行します。"
              : "解約すると、次回請求日まではProプランをご利用いただけます。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCanceling ? (
            <Button
              variant="outline"
              onClick={handleReactivate}
              disabled={loading}
            >
              {loading ? "処理中..." : "解約をキャンセル"}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">解約する</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に解約しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    解約すると、次回請求日以降はProプランの機能が利用できなくなります。
                    解約は次回請求日まで取り消すことができます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={loading}>
                    {loading ? "処理中..." : "解約する"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
