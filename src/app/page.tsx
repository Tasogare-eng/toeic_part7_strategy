import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_NAME } from "@/lib/constants"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg">{APP_NAME}</span>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button>新規登録</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            TOEIC Part7で<span className="text-primary">90%</span>の正答率を目指そう
          </h1>
          <p className="text-xl text-muted-foreground">
            中上級者向けのTOEIC Part7トレーニングサービス。
            長文読解問題を効率的に学習して、目標スコアを達成しましょう。
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">無料で始める</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">ログイン</Button>
            </Link>
          </div>
        </div>

        {/* 特徴セクション */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                長文読解トレーニング
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                実際のTOEIC Part7形式の問題で実践的なトレーニング。
                Email、記事、広告など多様な文書タイプに対応。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                進捗トラッキング
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                正答率や学習履歴を記録して、自分の成長を可視化。
                弱点を把握して効率的に学習を進められます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                目標設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                90%正答率を目標に、計画的に学習を進めましょう。
                目標達成度を確認しながらモチベーションを維持。
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>今すぐ学習を始めましょう</CardTitle>
              <CardDescription>
                無料でアカウントを作成して、TOEIC Part7のトレーニングを開始できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/register">
                <Button size="lg" className="w-full">アカウントを作成</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t bg-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2025 {APP_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
