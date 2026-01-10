import { ReactNode } from "react"
import Link from "next/link"
import { CreditCard, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const settingsNav = [
  {
    href: "/settings/subscription",
    label: "サブスクリプション",
    icon: CreditCard,
  },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            設定
          </h2>
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md",
                  "hover:bg-muted transition-colors"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
