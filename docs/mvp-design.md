# TOEIC Part7 トレーニング - MVP設計書

## 1. MVP概要

### 1.1 目的
最小限の機能でユーザー価値を検証し、早期にフィードバックを得る。

### 1.2 MVPスコープ
| 含める | 含めない（Phase 2以降） |
|--------|------------------------|
| ユーザー認証（登録/ログイン） | AI問題生成 |
| 長文読解問題の表示・解答 | 単語学習モジュール |
| 基本的な正答率表示 | 文法学習モジュール |
| シンプルなダッシュボード | 模試機能 |
| レスポンシブデザイン | PWA/オフライン対応 |

### 1.3 ターゲットユーザー
- TOEIC 600-800点の中上級者
- Part7の正答率向上を目指す学習者

---

## 2. 技術アーキテクチャ

### 2.1 技術スタック
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         Next.js 14 (App Router) + TypeScript    │
│              Tailwind CSS + shadcn/ui           │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                   Backend                        │
│            Next.js API Routes (RSC)             │
│              Server Actions                      │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                   Database                       │
│     Supabase (PostgreSQL + Auth + Storage)      │
└─────────────────────────────────────────────────┘
```

### 2.2 プロジェクト構成
```
toeic_part7/
├── docs/                          # ドキュメント
│   ├── requirements.md
│   └── mvp-design.md
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # 認証グループ
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/               # メイングループ（認証必須）
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── reading/
│   │   │   │   ├── page.tsx      # 問題一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 問題詳細・解答
│   │   │   ├── results/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx              # ランディングページ
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── reading/
│   │   │   ├── PassageCard.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── AnswerOptions.tsx
│   │   │   └── ResultSummary.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   └── RecentActivity.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── MobileNav.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # ブラウザ用クライアント
│   │   │   ├── server.ts         # サーバー用クライアント
│   │   │   └── middleware.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useProgress.ts
│   ├── types/
│   │   ├── database.ts           # Supabase型定義
│   │   ├── reading.ts
│   │   └── user.ts
│   └── actions/
│       ├── auth.ts               # Server Actions
│       ├── reading.ts
│       └── progress.ts
├── supabase/
│   ├── migrations/               # DBマイグレーション
│   └── seed.sql                  # 初期データ
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. データベース設計

### 3.1 ER図
```
┌──────────────┐       ┌──────────────────┐
│    users     │       │  reading_passages │
├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)          │
│ email        │       │ title            │
│ name         │       │ document_type    │
│ target_score │       │ content          │
│ current_score│       │ difficulty       │
│ created_at   │       │ created_at       │
└──────────────┘       └──────────────────┘
       │                        │
       │                        │ 1:N
       │                        ▼
       │               ┌──────────────────┐
       │               │ reading_questions │
       │               ├──────────────────┤
       │               │ id (PK)          │
       │               │ passage_id (FK)  │
       │               │ question_text    │
       │               │ question_type    │
       │               │ options (JSONB)  │
       │               │ correct_answer   │
       │               │ explanation      │
       │               │ order_index      │
       │               └──────────────────┘
       │                        │
       │ 1:N                    │
       ▼                        ▼
┌─────────────────────────────────────────┐
│            user_answers                  │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ user_id (FK)                            │
│ question_id (FK)                        │
│ selected_answer                         │
│ is_correct                              │
│ time_spent_seconds                      │
│ answered_at                             │
└─────────────────────────────────────────┘
```

### 3.2 テーブル定義

#### users（Supabase Auth拡張）
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  target_score INTEGER DEFAULT 900,
  current_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### reading_passages
```sql
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

-- インデックス
CREATE INDEX idx_passages_type ON public.reading_passages(document_type);
CREATE INDEX idx_passages_difficulty ON public.reading_passages(difficulty);
```

#### reading_questions
```sql
CREATE TABLE public.reading_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'main_idea', 'detail', 'inference', 'vocabulary', 'purpose'
  )),
  options JSONB NOT NULL, -- ["選択肢A", "選択肢B", "選択肢C", "選択肢D"]
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_questions_passage ON public.reading_questions(passage_id);
```

#### user_answers
```sql
CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.reading_questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL CHECK (selected_answer BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 同じ問題は1回のみ（最新の回答を保持）
  UNIQUE(user_id, question_id)
);

-- RLS
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
```

---

## 4. 画面設計

### 4.1 画面遷移図
```
[ランディング] ──→ [ログイン] ──→ [ダッシュボード]
      │               │                  │
      │               ▼                  ├──→ [長文問題一覧]
      │          [ユーザー登録]          │         │
      │               │                  │         ▼
      └───────────────┘                  │    [問題詳細・解答]
                                         │         │
                                         │         ▼
                                         │    [結果表示]
                                         │
                                         └──→ [学習履歴]
```

### 4.2 画面詳細

#### 4.2.1 ダッシュボード
```
┌─────────────────────────────────────────────────┐
│ [Logo] TOEIC Part7 Training    [User] [Logout] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ようこそ、{name}さん                           │
│                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ 総解答数    │ │ 正答率      │ │ 目標まで  │ │
│  │    42問     │ │   78%       │ │   12%     │ │
│  └─────────────┘ └─────────────┘ └───────────┘ │
│                                                 │
│  [▶ 長文読解を始める]                          │
│                                                 │
│  ── 最近の学習 ──────────────────────────────  │
│  │ Email形式 │ 5問中4問正解 │ 80% │ 1時間前   │ │
│  │ Article  │ 4問中3問正解 │ 75% │ 昨日      │ │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 4.2.2 長文問題一覧
```
┌─────────────────────────────────────────────────┐
│ [←] 長文読解問題                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  フィルター: [全て▼] [難易度▼]                 │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📧 Business Email                       │   │
│  │ 難易度: ★★★☆☆  問題数: 4問            │   │
│  │ [未回答]                    [開始 →]    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📰 News Article                         │   │
│  │ 難易度: ★★★★☆  問題数: 5問            │   │
│  │ [正答率: 80%]               [再挑戦 →]  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 4.2.3 問題詳細・解答画面
```
┌─────────────────────────────────────────────────┐
│ [←] Email形式  問題 2/4         [残り時間 3:24]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ From: John Smith <john@company.com>     │   │
│  │ To: All Staff                           │   │
│  │ Subject: Office Renovation Notice       │   │
│  │                                         │   │
│  │ Dear colleagues,                        │   │
│  │                                         │   │
│  │ I am writing to inform you that...      │   │
│  │ ...                                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Q. What is the main purpose of this email?    │
│                                                 │
│  ○ (A) To announce a new policy               │
│  ● (B) To notify about office changes         │
│  ○ (C) To request feedback                    │
│  ○ (D) To introduce new staff                 │
│                                                 │
│              [前へ] [確定して次へ →]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 4.2.4 結果画面
```
┌─────────────────────────────────────────────────┐
│ 結果                                           │
├─────────────────────────────────────────────────┤
│                                                 │
│           🎉 お疲れ様でした！                   │
│                                                 │
│              正答率: 75%                        │
│              (4問中 3問正解)                    │
│                                                 │
│  ── 問題別結果 ─────────────────────────────   │
│  │ Q1 │ ✓ 正解  │ main_idea  │ 45秒 │        │
│  │ Q2 │ ✗ 不正解│ detail     │ 62秒 │ [解説] │
│  │ Q3 │ ✓ 正解  │ inference  │ 38秒 │        │
│  │ Q4 │ ✓ 正解  │ vocabulary │ 29秒 │        │
│                                                 │
│        [ダッシュボードへ] [別の問題を解く]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 5. API設計

### 5.1 Server Actions

#### 認証関連
```typescript
// src/actions/auth.ts
'use server'

// ユーザー登録
export async function signUp(formData: FormData): Promise<ActionResult>

// ログイン
export async function signIn(formData: FormData): Promise<ActionResult>

// ログアウト
export async function signOut(): Promise<void>

// プロフィール更新
export async function updateProfile(data: ProfileUpdateData): Promise<ActionResult>
```

#### 長文読解関連
```typescript
// src/actions/reading.ts
'use server'

// 問題一覧取得
export async function getPassages(filters?: PassageFilters): Promise<Passage[]>

// 問題詳細取得
export async function getPassageWithQuestions(passageId: string): Promise<PassageWithQuestions>

// 回答を保存
export async function submitAnswer(data: SubmitAnswerData): Promise<AnswerResult>

// セット完了（複数問題の一括保存）
export async function completePassage(passageId: string, answers: Answer[]): Promise<PassageResult>
```

#### 進捗関連
```typescript
// src/actions/progress.ts
'use server'

// ダッシュボードデータ取得
export async function getDashboardStats(): Promise<DashboardStats>

// 学習履歴取得
export async function getRecentActivity(limit?: number): Promise<ActivityItem[]>

// 正答率取得
export async function getAccuracyRate(): Promise<AccuracyData>
```

### 5.2 型定義
```typescript
// src/types/reading.ts
export interface Passage {
  id: string
  title: string
  documentType: DocumentType
  content: string
  difficulty: number
  isMultiplePassage: boolean
  questionCount: number
  userProgress?: {
    completed: boolean
    accuracy: number
  }
}

export interface Question {
  id: string
  passageId: string
  questionText: string
  questionType: QuestionType
  options: string[]
  orderIndex: number
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: number
  explanation: string | null
}

export type DocumentType =
  | 'email' | 'article' | 'notice' | 'advertisement'
  | 'letter' | 'chat' | 'form' | 'review'

export type QuestionType =
  | 'main_idea' | 'detail' | 'inference' | 'vocabulary' | 'purpose'
```

---

## 6. 認証フロー

### 6.1 Supabase Auth設定
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

### 6.2 Middleware（認証チェック）
```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 認証が必要なパス
  const protectedPaths = ['/dashboard', '/reading', '/results']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // セッションチェック
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 7. 初期データ（シードデータ）

### 7.1 サンプル長文問題
```sql
-- supabase/seed.sql

-- Email形式のサンプル
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'sample-email-001',
  'Office Renovation Notice',
  'email',
  E'From: facilities@techcorp.com\nTo: All Employees\nSubject: Upcoming Office Renovation\n\nDear Team,\n\nWe are pleased to announce that our office will undergo a major renovation starting next month. The project aims to create a more collaborative and modern workspace.\n\nKey dates:\n- Phase 1 (3rd floor): March 1-15\n- Phase 2 (2nd floor): March 16-31\n\nDuring the renovation, affected departments will be relocated to the temporary workspace on the 5th floor. Please pack your personal belongings by February 28.\n\nIf you have any questions, please contact the Facilities team.\n\nBest regards,\nFacilities Management',
  3
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'sample-email-001',
  'What is the main purpose of this email?',
  'main_idea',
  '["To request employees to work from home", "To announce office renovation plans", "To introduce new team members", "To change company policies"]',
  1,
  'The email clearly states "our office will undergo a major renovation" and provides details about the schedule and relocation plans.',
  1
),
(
  'sample-email-001',
  'When should employees pack their belongings?',
  'detail',
  '["By March 1", "By March 15", "By February 28", "By March 31"]',
  2,
  'The email specifically states "Please pack your personal belongings by February 28."',
  2
);
```

---

## 8. 環境変数

```env
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 9. 開発タスク一覧

### Phase 1-A: プロジェクト基盤（1日目）
- [ ] Next.js 14プロジェクト作成
- [ ] TypeScript設定
- [ ] Tailwind CSS + shadcn/ui導入
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定
- [ ] 基本レイアウト作成

### Phase 1-B: 認証機能（2日目）
- [ ] Supabase Auth設定
- [ ] ログイン画面
- [ ] ユーザー登録画面
- [ ] 認証Middleware
- [ ] プロフィールテーブル作成

### Phase 1-C: 長文読解機能（3-4日目）
- [ ] DBテーブル作成（passages, questions, answers）
- [ ] シードデータ投入
- [ ] 問題一覧画面
- [ ] 問題詳細・解答画面
- [ ] 結果表示画面
- [ ] Server Actions実装

### Phase 1-D: ダッシュボード（5日目）
- [ ] 統計データ取得API
- [ ] ダッシュボード画面
- [ ] 最近の学習履歴表示
- [ ] レスポンシブ対応確認
- [ ] 動作テスト・修正

---

## 10. 成功基準

MVP完了の判定基準：
1. ✅ ユーザーが登録・ログインできる
2. ✅ 長文問題を解答できる
3. ✅ 正答率が表示される
4. ✅ スマホでも問題なく操作できる
5. ✅ 5問以上のサンプル問題が存在する
