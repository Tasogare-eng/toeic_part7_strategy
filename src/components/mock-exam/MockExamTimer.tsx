"use client"

import { useState, useEffect } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface MockExamTimerProps {
  startTime: Date
  totalMinutes: number
  onTimeUp: () => void
}

export function MockExamTimer({
  startTime,
  totalMinutes,
  onTimeUp,
}: MockExamTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
    return Math.max(0, totalMinutes * 60 - elapsed)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
      const remaining = Math.max(0, totalMinutes * 60 - elapsed)
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, totalMinutes, onTimeUp])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  const isWarning = remainingSeconds <= 300 // 5分以下
  const isCritical = remainingSeconds <= 60 // 1分以下

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
        isCritical
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : isWarning
          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          : "bg-muted"
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5 animate-pulse" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  )
}
