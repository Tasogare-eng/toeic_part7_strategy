import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 統計情報を取得
  const { count: passageCount } = await supabase
    .from("reading_passages")
    .select("*", { count: "exact", head: true })

  const { count: aiPassageCount } = await supabase
    .from("reading_passages")
    .select("*", { count: "exact", head: true })
    .eq("is_ai_generated", true)

  const { count: questionCount } = await supabase
    .from("reading_questions")
    .select("*", { count: "exact", head: true })

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">管理ダッシュボード</h1>
        <Link href="/admin/generate">
          <Button>新規問題を生成</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総パッセージ数</CardDescription>
            <CardTitle className="text-3xl">{passageCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI生成パッセージ</CardDescription>
            <CardTitle className="text-3xl">{aiPassageCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総設問数</CardDescription>
            <CardTitle className="text-3xl">{questionCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>登録ユーザー数</CardDescription>
            <CardTitle className="text-3xl">{userCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>問題生成</CardTitle>
            <CardDescription>
              AIを使用してTOEIC Part7形式の問題を自動生成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/generate">
              <Button className="w-full">問題を生成する</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックリンク</CardTitle>
            <CardDescription>
              よく使う機能へのショートカット
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/reading" className="block">
              <Button variant="outline" className="w-full justify-start">
                問題一覧を確認
              </Button>
            </Link>
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full justify-start">
                ユーザーダッシュボード
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
