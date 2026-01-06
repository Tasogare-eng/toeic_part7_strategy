import { redirect } from "next/navigation"
import Link from "next/link"
import { isAdmin } from "@/actions/ai/admin"
import { Button } from "@/components/ui/button"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminStatus = await isAdmin()

  if (!adminStatus) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-xl font-bold text-primary">
                TOEIC Admin
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">ダッシュボード</Button>
                </Link>
                <Link href="/admin/generate">
                  <Button variant="ghost" size="sm">問題生成</Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">ユーザー画面へ</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
