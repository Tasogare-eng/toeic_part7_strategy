"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, AlertTriangle, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimerProps {
  onTimeUpdate?: (seconds: number) => void
  recommendedTime?: number
  autoStart?: boolean
  showControls?: boolean
  className?: string
}

export function Timer({
  onTimeUpdate,
  recommendedTime,
  autoStart = true,
  showControls = false,
  className = "",
}: TimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    if (intervalRef.current) return
    setIsRunning(true)
  }, [])

  const stopTimer = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetTimer = useCallback(() => {
    stopTimer()
    setSeconds(0)
    onTimeUpdate?.(0)
  }, [stopTimer, onTimeUpdate])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  // Call onTimeUpdate in a separate effect to avoid updating parent state during render
  useEffect(() => {
    onTimeUpdate?.(seconds)
  }, [seconds, onTimeUpdate])

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isOvertime = recommendedTime ? seconds > recommendedTime : false
  const progressPercent = recommendedTime
    ? Math.min((seconds / recommendedTime) * 100, 100)
    : 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          transition-colors duration-300
          ${
            isOvertime
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }
        `}
      >
        {isOvertime ? (
          <AlertTriangle className="h-4 w-4 animate-pulse" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <span className="font-mono tabular-nums">{formatTime(seconds)}</span>
        {recommendedTime && (
          <span className="text-xs opacity-70">/ {formatTime(recommendedTime)}</span>
        )}
      </div>

      {showControls && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={isRunning ? stopTimer : startTimer}
          >
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {recommendedTime && (
        <div className="hidden sm:block w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOvertime ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  )
}

// シンプルな経過時間表示用（結果画面など）
export function TimeDisplay({
  seconds,
  recommendedTime,
  className = "",
}: {
  seconds: number
  recommendedTime?: number
  className?: string
}) {
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isOvertime = recommendedTime ? seconds > recommendedTime : false

  return (
    <span
      className={`
        font-mono tabular-nums
        ${isOvertime ? "text-red-600 dark:text-red-400" : ""}
        ${className}
      `}
    >
      {formatTime(seconds)}
      {recommendedTime && isOvertime && (
        <span className="text-xs ml-1">(+{formatTime(seconds - recommendedTime)})</span>
      )}
    </span>
  )
}
