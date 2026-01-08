# Phase 3: 学習管理 + Google認証 実装プラン

## 概要
- 学習進捗記録の拡張
- 正答率グラフの実装
- 弱点分析機能
- Google認証（OAuth）の追加

---

## 1. Google認証（OAuth）

### 1.1 Supabase設定（ダッシュボード）
1. Supabase Dashboard → Authentication → Providers
2. Googleを有効化
3. Google Cloud Consoleで OAuth 2.0 クライアントを作成
   - 承認済みリダイレクトURI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Client ID と Client Secret をSupabaseに設定

### 1.2 環境変数
```env
# .env.local に追加（参照用、実際の認証はSupabase側で管理）
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

### 1.3 実装ファイル

#### `src/actions/auth.ts` - OAuth対応追加
```typescript
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  })
  return { data, error }
}
```

#### `src/app/auth/callback/route.ts` - コールバック処理
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

#### `src/components/auth/GoogleLoginButton.tsx`
```typescript
"use client"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/actions/auth"

export function GoogleLoginButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => signInWithGoogle()}
    >
      <GoogleIcon className="mr-2 h-4 w-4" />
      Googleでログイン
    </Button>
  )
}
```

#### ログイン・登録画面の更新
- `src/components/auth/LoginForm.tsx` にGoogleボタン追加
- `src/components/auth/RegisterForm.tsx` にGoogleボタン追加

---

## 2. 学習進捗記録の拡張

### 2.1 データベース拡張

#### `supabase/migrations/005_add_analytics_views.sql`
```sql
-- 日別の統計ビュー
CREATE OR REPLACE VIEW daily_user_stats AS
SELECT
  user_id,
  DATE(answered_at) AS date,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy,
  SUM(time_spent_seconds) AS total_time_seconds
FROM user_answers
GROUP BY user_id, DATE(answered_at);

-- 文書タイプ別統計ビュー
CREATE OR REPLACE VIEW user_stats_by_document_type AS
SELECT
  ua.user_id,
  rp.document_type,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy
FROM user_answers ua
JOIN reading_passages rp ON ua.passage_id = rp.id
GROUP BY ua.user_id, rp.document_type;

-- 設問タイプ別統計ビュー
CREATE OR REPLACE VIEW user_stats_by_question_type AS
SELECT
  ua.user_id,
  rq.question_type,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy
FROM user_answers ua
JOIN reading_questions rq ON ua.question_id = rq.id
GROUP BY ua.user_id, rq.question_type;

-- ビューへのRLSは不要（ベーステーブルのRLSが適用される）
```

### 2.2 Server Actions拡張

#### `src/actions/analytics.ts` - 新規作成
```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

// 日別正答率の取得（グラフ用）
export async function getDailyAccuracy(days: number = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("daily_user_stats")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .limit(days)

  return data ?? []
}

// 文書タイプ別正答率
export async function getAccuracyByDocumentType() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("user_stats_by_document_type")
    .select("*")
    .eq("user_id", user.id)

  return data ?? []
}

// 設問タイプ別正答率
export async function getAccuracyByQuestionType() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("user_stats_by_question_type")
    .select("*")
    .eq("user_id", user.id)

  return data ?? []
}

// 弱点分析（正答率が低いカテゴリを抽出）
export async function getWeakAreas() {
  const [docTypes, questionTypes] = await Promise.all([
    getAccuracyByDocumentType(),
    getAccuracyByQuestionType()
  ])

  const weakDocTypes = docTypes
    .filter(d => d.accuracy < 70 && d.questions_answered >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)

  const weakQuestionTypes = questionTypes
    .filter(q => q.accuracy < 70 && q.questions_answered >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)

  return {
    documentTypes: weakDocTypes,
    questionTypes: weakQuestionTypes
  }
}

// 週別・月別サマリー
export async function getAccuracyTrend(period: 'week' | 'month' = 'week') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const daysAgo = period === 'week' ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  const { data } = await supabase
    .from("daily_user_stats")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split('T')[0])
    .order("date", { ascending: true })

  return data ?? []
}
```

---

## 3. 正答率グラフ

### 3.1 パッケージ追加
```bash
npm install recharts
```

### 3.2 チャートコンポーネント

#### `src/components/analytics/AccuracyChart.tsx`
```typescript
"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: Array<{ date: string; accuracy: number }>
}

export function AccuracyChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#2563eb"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

#### `src/components/analytics/CategoryChart.tsx`
```typescript
"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: Array<{ name: string; accuracy: number; count: number }>
  type: 'document' | 'question'
}

const COLORS = {
  high: '#22c55e',    // 80%以上: 緑
  medium: '#eab308',  // 60-80%: 黄
  low: '#ef4444'      // 60%未満: 赤
}

export function CategoryChart({ data, type }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip />
        <Bar dataKey="accuracy">
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.accuracy >= 80 ? COLORS.high :
                entry.accuracy >= 60 ? COLORS.medium : COLORS.low
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

#### `src/components/analytics/WeakAreasCard.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface Props {
  weakAreas: {
    documentTypes: Array<{ document_type: string; accuracy: number }>
    questionTypes: Array<{ question_type: string; accuracy: number }>
  }
}

export function WeakAreasCard({ weakAreas }: Props) {
  const hasWeakness = weakAreas.documentTypes.length > 0 || weakAreas.questionTypes.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          弱点分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasWeakness ? (
          <p className="text-muted-foreground">まだ弱点は検出されていません</p>
        ) : (
          <div className="space-y-4">
            {weakAreas.documentTypes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">苦手な文書タイプ</h4>
                <ul className="space-y-1">
                  {weakAreas.documentTypes.map(d => (
                    <li key={d.document_type} className="text-sm text-red-600">
                      {d.document_type}: {d.accuracy}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weakAreas.questionTypes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">苦手な設問タイプ</h4>
                <ul className="space-y-1">
                  {weakAreas.questionTypes.map(q => (
                    <li key={q.question_type} className="text-sm text-red-600">
                      {q.question_type}: {q.accuracy}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 4. 分析ページ

### 4.1 `src/app/(main)/analytics/page.tsx`
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccuracyChart } from "@/components/analytics/AccuracyChart"
import { CategoryChart } from "@/components/analytics/CategoryChart"
import { WeakAreasCard } from "@/components/analytics/WeakAreasCard"
import {
  getDailyAccuracy,
  getAccuracyByDocumentType,
  getAccuracyByQuestionType,
  getWeakAreas
} from "@/actions/analytics"

export default async function AnalyticsPage() {
  const [dailyData, docTypeData, questionTypeData, weakAreas] = await Promise.all([
    getDailyAccuracy(30),
    getAccuracyByDocumentType(),
    getAccuracyByQuestionType(),
    getWeakAreas()
  ])

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold">学習分析</h1>

      {/* 正答率推移グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>正答率の推移（過去30日）</CardTitle>
        </CardHeader>
        <CardContent>
          <AccuracyChart data={dailyData} />
        </CardContent>
      </Card>

      {/* カテゴリ別分析 */}
      <Tabs defaultValue="document">
        <TabsList>
          <TabsTrigger value="document">文書タイプ別</TabsTrigger>
          <TabsTrigger value="question">設問タイプ別</TabsTrigger>
        </TabsList>
        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle>文書タイプ別正答率</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart
                data={docTypeData.map(d => ({
                  name: d.document_type,
                  accuracy: d.accuracy,
                  count: d.questions_answered
                }))}
                type="document"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="question">
          <Card>
            <CardHeader>
              <CardTitle>設問タイプ別正答率</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart
                data={questionTypeData.map(q => ({
                  name: q.question_type,
                  accuracy: q.accuracy,
                  count: q.questions_answered
                }))}
                type="question"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 弱点分析 */}
      <WeakAreasCard weakAreas={weakAreas} />
    </div>
  )
}
```

---

## 5. ナビゲーション更新

### 5.1 サイドバー/ヘッダーに分析ページリンク追加
- `/analytics` へのリンクを追加
- アイコン: `BarChart3` (lucide-react)

### 5.2 ダッシュボードにサマリーカード追加
- 今週の正答率
- 弱点カテゴリのクイック表示
- 「詳細を見る」リンク

---

## 6. 実装順序

### Step 1: Google認証
1. `src/app/auth/callback/route.ts` 作成
2. `src/actions/auth.ts` に `signInWithGoogle` 追加
3. `src/components/auth/GoogleLoginButton.tsx` 作成
4. LoginForm, RegisterForm にボタン追加
5. Supabaseダッシュボードで Google Provider 設定

### Step 2: データベース拡張
1. `005_add_analytics_views.sql` 作成
2. Supabaseで実行

### Step 3: 分析 Server Actions
1. `src/actions/analytics.ts` 作成
2. 型定義追加

### Step 4: チャートライブラリ
1. `npm install recharts`
2. `src/components/analytics/` ディレクトリ作成

### Step 5: チャートコンポーネント
1. AccuracyChart.tsx
2. CategoryChart.tsx
3. WeakAreasCard.tsx

### Step 6: 分析ページ
1. `src/app/(main)/analytics/page.tsx` 作成
2. ナビゲーション更新

### Step 7: ダッシュボード拡張
1. サマリーカード追加
2. 分析ページへのリンク

---

## 7. ファイル一覧

| ファイル | 説明 |
|---------|------|
| `src/app/auth/callback/route.ts` | OAuth コールバック |
| `src/actions/auth.ts` | Google認証追加 |
| `src/components/auth/GoogleLoginButton.tsx` | Googleボタン |
| `supabase/migrations/005_add_analytics_views.sql` | 分析用ビュー |
| `src/actions/analytics.ts` | 分析データ取得 |
| `src/components/analytics/AccuracyChart.tsx` | 折れ線グラフ |
| `src/components/analytics/CategoryChart.tsx` | 棒グラフ |
| `src/components/analytics/WeakAreasCard.tsx` | 弱点表示 |
| `src/app/(main)/analytics/page.tsx` | 分析ページ |

---

## 8. テスト項目

### Google認証
- [ ] Googleログインボタンが表示される
- [ ] Googleアカウント選択画面に遷移する
- [ ] 認証後、ダッシュボードにリダイレクトされる
- [ ] プロフィールが自動作成される

### 分析機能
- [ ] 日別正答率グラフが表示される
- [ ] 文書タイプ別の棒グラフが表示される
- [ ] 設問タイプ別の棒グラフが表示される
- [ ] 弱点分析が正しく表示される
- [ ] データがない場合、適切なメッセージが表示される
