import { Metadata } from "next"
import { getSubscription } from "@/actions/subscription"
import { PricingSection } from "@/components/subscription/PricingSection"

export const metadata: Metadata = {
  title: "料金プラン | TOEIC Part7 トレーニング",
  description: "TOEIC Part7 トレーニングの料金プラン",
}

export default async function PricingPage() {
  const subscription = await getSubscription()
  const currentPlan = subscription?.planType ?? "free"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">シンプルな料金プラン</h1>
        <p className="text-muted-foreground">
          あなたの学習スタイルに合わせてお選びください
        </p>
      </div>

      <PricingSection currentPlan={currentPlan} />

      <div className="mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">よくある質問</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">いつでも解約できますか？</h3>
            <p className="text-sm text-muted-foreground">
              はい、いつでも解約可能です。解約しても、次回請求日まではProプランの機能をご利用いただけます。
            </p>
          </div>
          <div>
            <h3 className="font-medium">支払い方法は？</h3>
            <p className="text-sm text-muted-foreground">
              クレジットカード・デビットカードに対応しています。
            </p>
          </div>
          <div>
            <h3 className="font-medium">解約後のデータはどうなりますか？</h3>
            <p className="text-sm text-muted-foreground">
              解約後も学習データは保持されます。再度Proプランに加入すれば、これまでの学習履歴を引き続きご利用いただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
