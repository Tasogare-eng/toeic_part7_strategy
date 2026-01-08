"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts"
import type { CategoryStats } from "@/actions/analytics"

interface Props {
  data: CategoryStats[]
  title?: string
}

const getBarColor = (accuracy: number) => {
  if (accuracy >= 80) return "#22c55e" // green
  if (accuracy >= 60) return "#eab308" // yellow
  return "#ef4444" // red
}

const LABEL_MAP: Record<string, string> = {
  // Document types
  email: "メール",
  article: "記事",
  notice: "お知らせ",
  advertisement: "広告",
  letter: "手紙",
  chat: "チャット",
  form: "フォーム",
  review: "レビュー",
  // Question types
  main_idea: "主旨把握",
  detail: "詳細理解",
  inference: "推測",
  vocabulary: "語彙",
  purpose: "目的"
}

export function CategoryChart({ data, title }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        まだデータがありません
      </div>
    )
  }

  const formattedData = data.map(d => ({
    ...d,
    label: LABEL_MAP[d.name] || d.name
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={formattedData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={70}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{data.label}</p>
                  <p className="text-sm text-muted-foreground">
                    正答率: <span className="font-medium text-foreground">{data.accuracy}%</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.correct_count}/{data.questions_answered}問正解
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <ReferenceLine x={70} stroke="#ef4444" strokeDasharray="5 5" />
        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.accuracy)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
