"use client"

import { memo, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import type { DailyStats } from "@/actions/analytics"

interface Props {
  data: DailyStats[]
}

function AccuracyChartComponent({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        まだデータがありません
      </div>
    )
  }

  const formattedData = useMemo(() => data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  })), [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{data.date}</p>
                  <p className="text-sm text-muted-foreground">
                    正答率: <span className="font-medium text-foreground">{data.accuracy}%</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    回答数: {data.questions_answered}問
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "目標 90%", position: "right", fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// React.memoでメモ化して不要な再レンダリングを防止
export const AccuracyChart = memo(AccuracyChartComponent)
