"use client"

import { useState } from "react"
import { UsageLimitModal } from "./UsageLimitModal"

interface UsageLimitBlockProps {
  featureType: "reading" | "grammar" | "vocabulary"
  limit: number
  title: string
  message: string
}

export function UsageLimitBlock({
  featureType,
  limit,
  title,
  message,
}: UsageLimitBlockProps) {
  const [open, setOpen] = useState(true)

  return (
    <>
      <UsageLimitModal
        open={open}
        onClose={() => setOpen(false)}
        featureType={featureType}
        limit={limit}
      />
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <p className="text-muted-foreground mt-2">
          明日またお試しいただくか、Proプランにアップグレードしてください。
        </p>
      </div>
    </>
  )
}
