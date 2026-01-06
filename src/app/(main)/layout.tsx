import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut, getProfile } from "@/actions/auth"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg">
            TOEIC Part7 Training
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.name || profile?.email}
            </span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
