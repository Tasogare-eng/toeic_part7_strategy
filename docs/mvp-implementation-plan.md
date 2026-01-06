# MVP実装プラン

## 概要

このドキュメントは、TOEIC Part7トレーニングWebサービスのMVP実装手順を詳細に記載したものです。

---

## Phase 1-A: プロジェクト基盤セットアップ

### 1.1 Next.jsプロジェクト作成

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

選択オプション:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: @/*

### 1.2 追加パッケージインストール

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui セットアップ
npx shadcn@latest init

# shadcn/ui コンポーネント追加
npx shadcn@latest add button card input label form toast avatar dropdown-menu tabs progress skeleton

# ユーティリティ
npm install clsx tailwind-merge lucide-react

# 開発ツール
npm install -D @types/node
```

### 1.3 shadcn/ui 初期設定

`components.json` 設定:
```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 1.4 ディレクトリ作成

```bash
# 必要なディレクトリを作成
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(main\)/dashboard
mkdir -p src/app/\(main\)/reading/\[id\]
mkdir -p src/app/\(main\)/results
mkdir -p src/components/ui
mkdir -p src/components/auth
mkdir -p src/components/reading
mkdir -p src/components/dashboard
mkdir -p src/components/layout
mkdir -p src/lib/supabase
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/actions
mkdir -p supabase/migrations
```

### 1.5 環境変数設定

`.env.local.example` 作成:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.6 基本ファイル作成

#### src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### src/lib/constants.ts
```typescript
export const APP_NAME = "TOEIC Part7 Training"

export const DOCUMENT_TYPES = {
  email: "Email",
  article: "Article",
  notice: "Notice",
  advertisement: "Advertisement",
  letter: "Letter",
  chat: "Chat",
  form: "Form",
  review: "Review",
} as const

export const QUESTION_TYPES = {
  main_idea: "主旨把握",
  detail: "詳細理解",
  inference: "推測",
  vocabulary: "語彙",
  purpose: "目的",
} as const

export const DIFFICULTY_LABELS = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"]
```

---

## Phase 1-B: Supabase & 認証機能

### 2.1 Supabaseプロジェクト作成

1. https://supabase.com でプロジェクト作成
2. Project Settings > API から以下を取得:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2.2 Supabaseクライアント設定

#### src/lib/supabase/client.ts
```typescript
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### src/lib/supabase/server.ts
```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component からの呼び出し時は無視
          }
        },
      },
    }
  )
}
```

### 2.3 Middleware設定

#### src/middleware.ts
```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 認証が必要なパス
  const protectedPaths = ["/dashboard", "/reading", "/results"]
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // ログイン済みユーザーが認証ページにアクセスした場合
  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

### 2.4 データベーステーブル作成

#### supabase/migrations/001_create_tables.sql
```sql
-- profiles テーブル
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  target_score INTEGER DEFAULT 900,
  current_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- reading_passages テーブル
CREATE TABLE public.reading_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'email', 'article', 'notice', 'advertisement',
    'letter', 'chat', 'form', 'review'
  )),
  content TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  is_multiple_passage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 全ユーザーが閲覧可能
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view passages"
  ON public.reading_passages FOR SELECT
  TO authenticated
  USING (true);

-- reading_questions テーブル
CREATE TABLE public.reading_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'main_idea', 'detail', 'inference', 'vocabulary', 'purpose'
  )),
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reading_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON public.reading_questions FOR SELECT
  TO authenticated
  USING (true);

-- user_answers テーブル
CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.reading_questions(id) ON DELETE CASCADE,
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL CHECK (selected_answer BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.user_answers FOR UPDATE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_passages_type ON public.reading_passages(document_type);
CREATE INDEX idx_passages_difficulty ON public.reading_passages(difficulty);
CREATE INDEX idx_questions_passage ON public.reading_questions(passage_id);
CREATE INDEX idx_answers_user ON public.user_answers(user_id);
CREATE INDEX idx_answers_passage ON public.user_answers(passage_id);
```

### 2.5 型定義

#### src/types/database.ts
```typescript
export type DocumentType =
  | "email"
  | "article"
  | "notice"
  | "advertisement"
  | "letter"
  | "chat"
  | "form"
  | "review"

export type QuestionType =
  | "main_idea"
  | "detail"
  | "inference"
  | "vocabulary"
  | "purpose"

export interface Profile {
  id: string
  email: string
  name: string | null
  target_score: number
  current_score: number | null
  created_at: string
  updated_at: string
}

export interface ReadingPassage {
  id: string
  title: string
  document_type: DocumentType
  content: string
  difficulty: number
  is_multiple_passage: boolean
  created_at: string
}

export interface ReadingQuestion {
  id: string
  passage_id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  correct_answer: number
  explanation: string | null
  order_index: number
  created_at: string
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  passage_id: string
  selected_answer: number
  is_correct: boolean
  time_spent_seconds: number | null
  answered_at: string
}

// 拡張型
export interface PassageWithQuestions extends ReadingPassage {
  questions: ReadingQuestion[]
}

export interface PassageWithProgress extends ReadingPassage {
  question_count: number
  user_progress: {
    answered_count: number
    correct_count: number
  } | null
}
```

### 2.6 認証Server Actions

#### src/actions/auth.ts
```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  error?: string
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile
}
```

### 2.7 認証コンポーネント

#### src/components/auth/LoginForm.tsx
```typescript
"use client"

import { useState } from "react"
import { signIn } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await signIn(formData)
    if (!result.success) {
      setError(result.error || "ログインに失敗しました")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          アカウントにログインして学習を始めましょう
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="text-primary hover:underline">
            新規登録
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
```

#### src/components/auth/RegisterForm.tsx
```typescript
"use client"

import { useState } from "react"
import { signUp } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await signUp(formData)
    if (!result.success) {
      setError(result.error || "登録に失敗しました")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>新規登録</CardTitle>
        <CardDescription>
          アカウントを作成してTOEIC Part7の学習を始めましょう
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="山田 太郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="6文字以上"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "登録中..." : "アカウント作成"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-primary hover:underline">
            ログイン
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
```

### 2.8 認証ページ

#### src/app/(auth)/layout.tsx
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {children}
    </div>
  )
}
```

#### src/app/(auth)/login/page.tsx
```typescript
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return <LoginForm />
}
```

#### src/app/(auth)/register/page.tsx
```typescript
import { RegisterForm } from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return <RegisterForm />
}
```

---

## Phase 1-C: 長文読解機能

### 3.1 Server Actions

#### src/actions/reading.ts
```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import type { PassageWithQuestions, PassageWithProgress, UserAnswer } from "@/types/database"

export async function getPassages(): Promise<PassageWithProgress[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // 問題一覧と各問題の設問数を取得
  const { data: passages } = await supabase
    .from("reading_passages")
    .select(`
      *,
      reading_questions(count)
    `)
    .order("created_at", { ascending: false })

  if (!passages) return []

  // ユーザーの回答状況を取得
  const { data: answers } = await supabase
    .from("user_answers")
    .select("passage_id, is_correct")
    .eq("user_id", user.id)

  const answersByPassage = (answers || []).reduce((acc, answer) => {
    if (!acc[answer.passage_id]) {
      acc[answer.passage_id] = { answered: 0, correct: 0 }
    }
    acc[answer.passage_id].answered++
    if (answer.is_correct) acc[answer.passage_id].correct++
    return acc
  }, {} as Record<string, { answered: number; correct: number }>)

  return passages.map((passage) => ({
    ...passage,
    question_count: passage.reading_questions[0]?.count || 0,
    user_progress: answersByPassage[passage.id]
      ? {
          answered_count: answersByPassage[passage.id].answered,
          correct_count: answersByPassage[passage.id].correct,
        }
      : null,
  }))
}

export async function getPassageWithQuestions(
  passageId: string
): Promise<PassageWithQuestions | null> {
  const supabase = await createClient()

  const { data: passage } = await supabase
    .from("reading_passages")
    .select(`
      *,
      questions:reading_questions(*)
    `)
    .eq("id", passageId)
    .single()

  if (!passage) return null

  return {
    ...passage,
    questions: passage.questions.sort((a, b) => a.order_index - b.order_index),
  }
}

export async function submitAnswers(
  passageId: string,
  answers: { questionId: string; selectedAnswer: number; timeSpent: number }[]
): Promise<{ success: boolean; results: UserAnswer[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, results: [] }
  }

  // 正答を取得
  const { data: questions } = await supabase
    .from("reading_questions")
    .select("id, correct_answer")
    .eq("passage_id", passageId)

  if (!questions) {
    return { success: false, results: [] }
  }

  const correctAnswerMap = questions.reduce((acc, q) => {
    acc[q.id] = q.correct_answer
    return acc
  }, {} as Record<string, number>)

  // 回答を保存
  const answersToInsert = answers.map((answer) => ({
    user_id: user.id,
    question_id: answer.questionId,
    passage_id: passageId,
    selected_answer: answer.selectedAnswer,
    is_correct: correctAnswerMap[answer.questionId] === answer.selectedAnswer,
    time_spent_seconds: answer.timeSpent,
  }))

  const { data: insertedAnswers, error } = await supabase
    .from("user_answers")
    .upsert(answersToInsert, { onConflict: "user_id,question_id" })
    .select()

  if (error) {
    console.error("Error submitting answers:", error)
    return { success: false, results: [] }
  }

  return { success: true, results: insertedAnswers || [] }
}

export async function getPassageResults(passageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: passage } = await supabase
    .from("reading_passages")
    .select(`
      *,
      questions:reading_questions(*)
    `)
    .eq("id", passageId)
    .single()

  const { data: answers } = await supabase
    .from("user_answers")
    .select("*")
    .eq("user_id", user.id)
    .eq("passage_id", passageId)

  if (!passage) return null

  return {
    passage,
    questions: passage.questions.sort((a, b) => a.order_index - b.order_index),
    answers: answers || [],
  }
}
```

### 3.2 長文読解コンポーネント

#### src/components/reading/PassageCard.tsx
```typescript
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DOCUMENT_TYPES, DIFFICULTY_LABELS } from "@/lib/constants"
import type { PassageWithProgress } from "@/types/database"

interface PassageCardProps {
  passage: PassageWithProgress
}

export function PassageCard({ passage }: PassageCardProps) {
  const progress = passage.user_progress
  const hasAnswered = progress && progress.answered_count > 0
  const accuracy = hasAnswered
    ? Math.round((progress.correct_count / progress.answered_count) * 100)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{getDocumentIcon(passage.document_type)}</span>
          <span>{passage.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {DOCUMENT_TYPES[passage.document_type]}
            </p>
            <p className="text-sm">
              難易度: {DIFFICULTY_LABELS[passage.difficulty]} | 問題数: {passage.question_count}問
            </p>
            {hasAnswered && (
              <p className="text-sm text-green-600">
                正答率: {accuracy}% ({progress.correct_count}/{progress.answered_count})
              </p>
            )}
          </div>
          <Link href={`/reading/${passage.id}`}>
            <Button variant={hasAnswered ? "outline" : "default"}>
              {hasAnswered ? "再挑戦" : "開始"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function getDocumentIcon(type: string): string {
  const icons: Record<string, string> = {
    email: "📧",
    article: "📰",
    notice: "📋",
    advertisement: "📢",
    letter: "✉️",
    chat: "💬",
    form: "📝",
    review: "⭐",
  }
  return icons[type] || "📄"
}
```

#### src/components/reading/QuestionView.tsx
```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { submitAnswers } from "@/actions/reading"
import type { PassageWithQuestions } from "@/types/database"

interface QuestionViewProps {
  passage: PassageWithQuestions
}

export function QuestionView({ passage }: QuestionViewProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [startTime] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [timesSpent, setTimesSpent] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = passage.questions[currentIndex]
  const isLastQuestion = currentIndex === passage.questions.length - 1
  const hasAnswered = answers[currentQuestion.id] !== undefined

  function handleAnswerChange(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: parseInt(value),
    }))
  }

  function handleNext() {
    // 経過時間を記録
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    setTimesSpent((prev) => ({
      ...prev,
      [currentQuestion.id]: timeSpent,
    }))

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentIndex((prev) => prev + 1)
      setQuestionStartTime(Date.now())
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)

    const answerData = passage.questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] ?? -1,
      timeSpent: timesSpent[q.id] ?? 0,
    }))

    await submitAnswers(passage.id, answerData)
    router.push(`/results?passageId=${passage.id}`)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 本文 */}
      <Card>
        <CardContent className="pt-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {passage.content}
          </pre>
        </CardContent>
      </Card>

      {/* 設問 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            問題 {currentIndex + 1} / {passage.questions.length}
          </span>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-medium">{currentQuestion.question_text}</p>

            <RadioGroup
              value={answers[currentQuestion.id]?.toString()}
              onValueChange={handleAnswerChange}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    ({String.fromCharCode(65 + index)}) {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            disabled={currentIndex === 0}
          >
            前へ
          </Button>
          <Button onClick={handleNext} disabled={!hasAnswered || isSubmitting}>
            {isSubmitting
              ? "送信中..."
              : isLastQuestion
              ? "結果を見る"
              : "次へ"}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 3.3 長文読解ページ

#### src/app/(main)/reading/page.tsx
```typescript
import { getPassages } from "@/actions/reading"
import { PassageCard } from "@/components/reading/PassageCard"

export default async function ReadingPage() {
  const passages = await getPassages()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">長文読解問題</h1>

      {passages.length === 0 ? (
        <p className="text-muted-foreground">問題がありません</p>
      ) : (
        <div className="grid gap-4">
          {passages.map((passage) => (
            <PassageCard key={passage.id} passage={passage} />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### src/app/(main)/reading/[id]/page.tsx
```typescript
import { notFound } from "next/navigation"
import { getPassageWithQuestions } from "@/actions/reading"
import { QuestionView } from "@/components/reading/QuestionView"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReadingDetailPage({ params }: Props) {
  const { id } = await params
  const passage = await getPassageWithQuestions(id)

  if (!passage) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{passage.title}</h1>
      <QuestionView passage={passage} />
    </div>
  )
}
```

---

## Phase 1-D: ダッシュボード

### 4.1 進捗Server Actions

#### src/actions/progress.ts
```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

export interface DashboardStats {
  totalAnswered: number
  correctCount: number
  accuracyRate: number
  targetProgress: number
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: answers } = await supabase
    .from("user_answers")
    .select("is_correct")
    .eq("user_id", user.id)

  if (!answers || answers.length === 0) {
    return {
      totalAnswered: 0,
      correctCount: 0,
      accuracyRate: 0,
      targetProgress: 0,
    }
  }

  const totalAnswered = answers.length
  const correctCount = answers.filter((a) => a.is_correct).length
  const accuracyRate = Math.round((correctCount / totalAnswered) * 100)
  const targetProgress = Math.min(Math.round((accuracyRate / 90) * 100), 100)

  return {
    totalAnswered,
    correctCount,
    accuracyRate,
    targetProgress,
  }
}

export interface RecentActivity {
  passageId: string
  passageTitle: string
  documentType: string
  answeredCount: number
  correctCount: number
  answeredAt: string
}

export async function getRecentActivity(limit = 5): Promise<RecentActivity[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: answers } = await supabase
    .from("user_answers")
    .select(`
      passage_id,
      is_correct,
      answered_at,
      reading_passages(title, document_type)
    `)
    .eq("user_id", user.id)
    .order("answered_at", { ascending: false })

  if (!answers) return []

  // パッセージごとにグループ化
  const grouped = answers.reduce((acc, answer) => {
    const key = answer.passage_id
    if (!acc[key]) {
      acc[key] = {
        passageId: answer.passage_id,
        passageTitle: answer.reading_passages?.title || "",
        documentType: answer.reading_passages?.document_type || "",
        answeredCount: 0,
        correctCount: 0,
        answeredAt: answer.answered_at,
      }
    }
    acc[key].answeredCount++
    if (answer.is_correct) acc[key].correctCount++
    return acc
  }, {} as Record<string, RecentActivity>)

  return Object.values(grouped).slice(0, limit)
}
```

### 4.2 ダッシュボードコンポーネント

#### src/components/dashboard/StatsCard.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### src/components/dashboard/RecentActivityList.tsx
```typescript
import { DOCUMENT_TYPES } from "@/lib/constants"
import type { RecentActivity } from "@/actions/progress"

interface RecentActivityListProps {
  activities: RecentActivity[]
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">まだ学習履歴がありません</p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const accuracy = Math.round(
          (activity.correctCount / activity.answeredCount) * 100
        )
        return (
          <div
            key={activity.passageId}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div>
              <p className="font-medium">{activity.passageTitle}</p>
              <p className="text-sm text-muted-foreground">
                {DOCUMENT_TYPES[activity.documentType as keyof typeof DOCUMENT_TYPES]}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">
                {activity.correctCount}/{activity.answeredCount}問正解
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 4.3 ダッシュボードページ

#### src/app/(main)/dashboard/page.tsx
```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentActivityList } from "@/components/dashboard/RecentActivityList"
import { getProfile } from "@/actions/auth"
import { getDashboardStats, getRecentActivity } from "@/actions/progress"

export default async function DashboardPage() {
  const [profile, stats, activities] = await Promise.all([
    getProfile(),
    getDashboardStats(),
    getRecentActivity(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        ようこそ、{profile?.name || "ゲスト"}さん
      </h1>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="総解答数"
          value={`${stats?.totalAnswered || 0}問`}
        />
        <StatsCard
          title="正答率"
          value={`${stats?.accuracyRate || 0}%`}
          description={`${stats?.correctCount || 0}問正解`}
        />
        <StatsCard
          title="目標達成度"
          value={`${stats?.targetProgress || 0}%`}
          description="目標: 90%正答率"
        />
      </div>

      {/* 学習開始ボタン */}
      <Card>
        <CardContent className="pt-6">
          <Link href="/reading">
            <Button size="lg" className="w-full">
              長文読解を始める
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 最近の学習 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の学習</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityList activities={activities} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.4 メインレイアウト

#### src/app/(main)/layout.tsx
```typescript
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
```

---

## Phase 1-E: シードデータ

#### supabase/seed.sql
```sql
-- サンプル問題1: Email
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Office Renovation Notice',
  'email',
  E'From: facilities@techcorp.com\nTo: All Employees\nSubject: Upcoming Office Renovation\n\nDear Team,\n\nWe are pleased to announce that our office will undergo a major renovation starting next month. The project aims to create a more collaborative and modern workspace.\n\nKey dates:\n- Phase 1 (3rd floor): March 1-15\n- Phase 2 (2nd floor): March 16-31\n\nDuring the renovation, affected departments will be relocated to the temporary workspace on the 5th floor. Please pack your personal belongings by February 28.\n\nIf you have any questions, please contact the Facilities team.\n\nBest regards,\nFacilities Management',
  3
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'What is the main purpose of this email?',
  'main_idea',
  '["To request employees to work from home", "To announce office renovation plans", "To introduce new team members", "To change company policies"]',
  1,
  'The email clearly states "our office will undergo a major renovation" and provides details about the schedule.',
  1
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'When should employees pack their belongings?',
  'detail',
  '["By March 1", "By March 15", "By February 28", "By March 31"]',
  2,
  'The email specifically states "Please pack your personal belongings by February 28."',
  2
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Where will affected departments be relocated?',
  'detail',
  '["To the 2nd floor", "To the 3rd floor", "To the 5th floor", "To a different building"]',
  2,
  'The email mentions "relocated to the temporary workspace on the 5th floor."',
  3
);

-- サンプル問題2: Article
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'New Product Launch Success',
  'article',
  E'Tech Innovations Inc. Reports Record-Breaking Sales\n\nSAN FRANCISCO - Tech Innovations Inc. announced yesterday that its latest smartphone, the TI-X1, has exceeded all sales expectations in its first month on the market.\n\nThe device, which features an innovative foldable screen and advanced AI capabilities, sold over 2 million units worldwide within the first three weeks of its release. This represents a 40% increase compared to the company''s previous flagship model.\n\n"We are thrilled with the market response," said CEO Maria Chen. "The TI-X1 represents years of research and development, and it''s gratifying to see consumers embrace our vision for the future of mobile technology."\n\nAnalysts attribute the success to the phone''s unique design and competitive pricing strategy. The TI-X1 is priced at $899, significantly lower than comparable foldable devices from competitors.\n\nThe company plans to expand production capacity to meet the growing demand and expects to ship an additional 3 million units by the end of the quarter.',
  4
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'What is the article mainly about?',
  'main_idea',
  '["A company''s financial problems", "The successful launch of a new product", "A CEO''s retirement announcement", "A merger between two companies"]',
  1,
  'The article discusses the successful launch and sales of the TI-X1 smartphone.',
  1
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'How many units were sold in the first three weeks?',
  'detail',
  '["1 million", "2 million", "3 million", "4 million"]',
  1,
  'The article states "sold over 2 million units worldwide within the first three weeks."',
  2
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'What can be inferred about the TI-X1''s pricing?',
  'inference',
  '["It is the most expensive phone on the market", "It is priced lower than similar products", "The price will increase soon", "It is only available in limited markets"]',
  1,
  'The article mentions the phone is "priced at $899, significantly lower than comparable foldable devices."',
  3
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'The word "embrace" in paragraph 3 is closest in meaning to',
  'vocabulary',
  '["reject", "accept enthusiastically", "ignore", "criticize"]',
  1,
  '"Embrace" means to accept or support something willingly or enthusiastically.',
  4
);

-- サンプル問題3: Notice
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Library Policy Update',
  'notice',
  E'WESTFIELD PUBLIC LIBRARY\nIMPORTANT NOTICE TO ALL PATRONS\n\nEffective April 1, the following changes to library policies will take effect:\n\nBorrowing Limits\n- Adult cardholders: Maximum 15 items (increased from 10)\n- Children/Teen cardholders: Maximum 10 items (increased from 7)\n- Digital materials: Maximum 5 items per category\n\nLoan Periods\n- Books and audiobooks: 3 weeks (no change)\n- DVDs and Blu-rays: 1 week (reduced from 2 weeks)\n- Magazines: 1 week (no change)\n\nLate Fees\nWe are pleased to announce the elimination of all late fees for overdue materials. However, patrons with items more than 30 days overdue will have their borrowing privileges suspended until the items are returned.\n\nNew Services\n- Online reservation system for study rooms\n- Expanded digital collection including academic journals\n- Free museum passes available for checkout\n\nFor questions about these changes, please visit the information desk or call (555) 123-4567.',
  2
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'What is the purpose of this notice?',
  'purpose',
  '["To announce library closure", "To inform about policy changes", "To recruit new staff", "To promote a book sale"]',
  1,
  'The notice clearly states it is informing patrons about policy changes effective April 1.',
  1
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'How has the DVD loan period changed?',
  'detail',
  '["It increased to 2 weeks", "It decreased to 1 week", "It stayed the same", "DVDs are no longer available"]',
  1,
  'The notice states DVDs now have a 1-week loan period, "reduced from 2 weeks."',
  2
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'What happens if a patron keeps an item for more than 30 days?',
  'detail',
  '["They must pay a fine", "Their account is deleted", "They cannot borrow until items are returned", "Nothing happens"]',
  2,
  'The notice states patrons with items "more than 30 days overdue will have their borrowing privileges suspended."',
  3
);
```

---

## 実装チェックリスト

### Phase 1-A: プロジェクト基盤
- [ ] Next.js 14プロジェクト作成
- [ ] 追加パッケージインストール
- [ ] shadcn/ui セットアップ
- [ ] ディレクトリ構造作成
- [ ] 環境変数ファイル作成
- [ ] 基本ユーティリティ作成

### Phase 1-B: 認証機能
- [ ] Supabaseプロジェクト作成
- [ ] Supabaseクライアント設定
- [ ] Middleware設定
- [ ] データベーステーブル作成（SQL実行）
- [ ] 型定義作成
- [ ] 認証Server Actions作成
- [ ] ログインフォーム作成
- [ ] 登録フォーム作成
- [ ] 認証ページ作成

### Phase 1-C: 長文読解機能
- [ ] 読解Server Actions作成
- [ ] PassageCardコンポーネント作成
- [ ] QuestionViewコンポーネント作成
- [ ] 問題一覧ページ作成
- [ ] 問題詳細ページ作成
- [ ] 結果ページ作成

### Phase 1-D: ダッシュボード
- [ ] 進捗Server Actions作成
- [ ] StatsCardコンポーネント作成
- [ ] RecentActivityListコンポーネント作成
- [ ] ダッシュボードページ作成
- [ ] メインレイアウト作成
- [ ] ランディングページ作成

### Phase 1-E: 仕上げ
- [ ] シードデータ投入
- [ ] レスポンシブ対応確認
- [ ] 動作テスト
- [ ] バグ修正

---

## 動作確認手順

1. `npm run dev` で開発サーバー起動
2. http://localhost:3000 にアクセス
3. 新規登録でアカウント作成
4. ダッシュボードが表示されることを確認
5. 長文読解問題を解答
6. 結果が表示されることを確認
7. ダッシュボードに統計が反映されることを確認
