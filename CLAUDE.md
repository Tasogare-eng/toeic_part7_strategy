# CLAUDE.md - TOEIC Part7 トレーニングWebサービス

このファイルはClaude Codeがプロジェクトを理解するためのガイドです。

## プロジェクト概要

TOEIC Part7で90%の正解率を目指す中上級者（600-800点）向けの学習Webサービス。
文法・単語・長文をバランスよく学習できるトレーニングプラットフォーム。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui |
| バックエンド | Next.js Server Actions |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Email + Google OAuth) |
| 決済 | Stripe (SDK v20.1.2 / API 2025-12-15.clover) |
| AI | OpenAI GPT-4 API |
| キャッシュ | Next.js unstable_cache |
| PWA | next-pwa |
| デプロイ | Vercel |

## ディレクトリ構成

```
toeic_part7/
├── CLAUDE.md                      # このファイル
├── docs/                          # ドキュメント
│   ├── requirements.md            # 機能要件定義書
│   ├── mvp-design.md              # MVP設計書
│   ├── mvp-implementation-plan.md # MVP実装プラン
│   └── phase5-implementation-plan.md # Phase 5実装プラン
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # 認証グループ
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/              # 管理者グループ
│   │   │   └── admin/
│   │   │       ├── page.tsx      # 管理ダッシュボード
│   │   │       └── generate/page.tsx # AI問題生成（長文/文法/単語）
│   │   ├── (main)/               # メイングループ（認証必須）
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── reading/          # 長文読解
│   │   │   ├── grammar/          # 文法学習
│   │   │   ├── vocabulary/       # 単語学習
│   │   │   ├── analytics/        # 学習分析
│   │   │   ├── review/           # 復習機能
│   │   │   ├── mock-exam/        # 模試機能
│   │   │   │   ├── page.tsx      # 模試選択
│   │   │   │   ├── [id]/page.tsx # 模試実行
│   │   │   │   ├── [id]/result/page.tsx # 結果
│   │   │   │   └── history/page.tsx # 履歴
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx              # ランディングページ
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   ├── auth/                 # LoginForm, RegisterForm
│   │   ├── reading/              # PassageCard, QuestionView
│   │   ├── grammar/              # GrammarStats, GrammarCategoryStats
│   │   ├── vocabulary/           # FlashCard, VocabularyStats
│   │   ├── analytics/            # AccuracyChart, CategoryChart, DynamicCharts
│   │   ├── mock-exam/            # MockExamSelector, Session, Timer, Question, Progress, Result, History
│   │   ├── admin/                # GrammarGenerator, VocabularyGenerator
│   │   ├── dashboard/            # StatsCard, RecentActivityList
│   │   └── layout/               # Header, Sidebar, MobileNav
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # ブラウザ用
│   │   │   └── server.ts         # サーバー用（createClient, createServiceClient）
│   │   ├── cache.ts              # キャッシュ設定（CACHE_TIMES, CACHE_TAGS）
│   │   ├── utils.ts              # cn() ヘルパー
│   │   └── constants.ts          # 定数定義
│   ├── hooks/                    # カスタムフック
│   ├── types/
│   │   ├── database.ts           # DB型定義
│   │   ├── vocabulary.ts         # 単語型定義
│   │   ├── grammar.ts            # 文法型定義
│   │   ├── mock-exam.ts          # 模試型定義
│   │   └── next-pwa.d.ts         # PWA型定義
│   ├── actions/
│   │   ├── auth.ts               # 認証アクション
│   │   ├── reading.ts            # 長文読解アクション
│   │   ├── progress.ts           # 進捗アクション（キャッシュ対応）
│   │   ├── analytics.ts          # 分析アクション（キャッシュ対応）
│   │   ├── vocabulary.ts         # 単語学習アクション
│   │   ├── grammar.ts            # 文法問題アクション
│   │   ├── review.ts             # 復習アクション
│   │   ├── timer.ts              # 時間管理アクション
│   │   ├── mock-exam.ts          # 模試アクション
│   │   └── ai/                   # AI生成アクション
│   │       ├── generate-passage.ts
│   │       ├── generate-grammar.ts
│   │       └── generate-vocabulary.ts
│   └── middleware.ts             # 認証Middleware
├── supabase/
│   ├── migrations/               # DBマイグレーション
│   │   ├── 001_create_tables.sql
│   │   ├── ...
│   │   └── 008_add_mock_exam.sql
│   └── seed.sql                  # 初期データ
├── public/
│   ├── manifest.json             # PWAマニフェスト
│   └── icons/                    # PWAアイコン
├── tests/                        # E2Eテスト（Playwright）
│   ├── phase3.spec.ts
│   ├── phase5.spec.ts
│   └── phase5.authenticated.spec.ts
├── .env.local                    # 環境変数（Git管理外）
├── next.config.ts                # Next.js設定（PWA含む）
├── tailwind.config.ts
├── components.json               # shadcn/ui設定
├── tsconfig.json
└── package.json
```

## データベース設計

### テーブル一覧

| テーブル | 説明 | RLS |
|---------|------|-----|
| `profiles` | ユーザープロフィール（auth.users拡張） | 有効 |
| `reading_passages` | 長文読解の本文 | 有効 |
| `reading_questions` | 長文読解の設問 | 有効 |
| `user_answers` | ユーザーの回答履歴 | 有効 |
| `vocabulary` | 単語データ | 有効 |
| `vocabulary_progress` | 単語学習進捗 | 有効 |
| `grammar_questions` | 文法問題 | 有効 |
| `grammar_answers` | 文法回答履歴 | 有効 |
| `bookmarks` | ブックマーク | 有効 |
| `review_schedule` | 復習スケジュール | 有効 |
| `mock_exams` | 模試セッション | 有効 |
| `mock_exam_questions` | 模試問題 | 有効 |
| `mock_exam_answers` | 模試回答 | 有効 |
| `mock_exam_results` | 模試結果 | 有効 |
| `daily_user_stats` | 日別統計（ビュー） | 有効 |

### 主要カラム

```sql
-- profiles
id, email, name, target_score, current_score, created_at, updated_at

-- reading_passages
id, title, document_type, content, difficulty, is_multiple_passage, created_at

-- reading_questions
id, passage_id, question_text, question_type, options(JSONB), correct_answer, explanation, order_index

-- user_answers
id, user_id, question_id, passage_id, selected_answer, is_correct, time_spent_seconds, answered_at

-- mock_exams
id, user_id, exam_type, status, time_limit_minutes, started_at, completed_at

-- mock_exam_results
id, mock_exam_id, user_id, total_questions, correct_count, part5_total, part5_correct,
part6_total, part6_correct, part7_total, part7_correct, total_time_seconds, estimated_score
```

## 型定義

```typescript
// 文書タイプ
type DocumentType = 'email' | 'article' | 'notice' | 'advertisement' | 'letter' | 'chat' | 'form' | 'review'

// 設問タイプ
type QuestionType = 'main_idea' | 'detail' | 'inference' | 'vocabulary' | 'purpose'

// 文法カテゴリ
type GrammarCategory = 'parts_of_speech' | 'tense' | 'relative_clause' | 'conjunction' |
  'preposition' | 'subjunctive' | 'passive' | 'comparison' | 'article' | 'pronoun'

// 単語レベル
type VocabularyLevel = 600 | 700 | 800 | 900

// 模試タイプ
type MockExamType = 'full' | 'mini_15' | 'mini_30'

// 主要インターフェース
interface Profile { id, email, name, target_score, current_score, ... }
interface ReadingPassage { id, title, document_type, content, difficulty, ... }
interface ReadingQuestion { id, passage_id, question_text, options[], correct_answer, ... }
interface UserAnswer { id, user_id, question_id, selected_answer, is_correct, ... }
interface MockExam { id, user_id, exam_type, status, time_limit_minutes, ... }
interface MockExamResult { id, mock_exam_id, total_questions, correct_count, estimated_score, ... }
```

## 開発環境

### Node.js パス
```bash
# npm/npx の絶対パス（Homebrew Node.js 20）
/opt/homebrew/opt/node@20/bin/npm
/opt/homebrew/opt/node@20/bin/npx
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint

# 型チェック
npx tsc --noEmit

# E2Eテスト実行
npx playwright test

# E2Eテスト（認証付き）
TEST_USER_EMAIL=xxx TEST_USER_PASSWORD=xxx npx playwright test --project=authenticated
```

## 環境変数

`.env.local` に以下を設定:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000

# Google OAuth（Supabase側で設定）
```

## Server Actions

### 認証 (src/actions/auth.ts)
```typescript
signUp(formData)      // ユーザー登録
signIn(formData)      // ログイン
signOut()             // ログアウト
getUser()             // 現在のユーザー取得
getProfile()          // プロフィール取得
```

### 長文読解 (src/actions/reading.ts)
```typescript
getPassages()                        // 問題一覧取得
getPassageWithQuestions(passageId)   // 問題詳細取得
submitAnswers(passageId, answers)    // 回答送信
getPassageResults(passageId)         // 結果取得
```

### 進捗 (src/actions/progress.ts) - キャッシュ対応
```typescript
getDashboardStats()      // ダッシュボード統計（キャッシュ: 30分）
getRecentActivity(limit) // 最近の学習履歴（キャッシュ: 15分）
```

### 分析 (src/actions/analytics.ts) - キャッシュ対応
```typescript
getDailyAccuracy(days)       // 日別正答率（キャッシュ: 4時間）
getAccuracyByDocumentType()  // 文書タイプ別正答率（キャッシュ: 2時間）
getAccuracyByQuestionType()  // 設問タイプ別正答率（キャッシュ: 2時間）
getAccuracyByDifficulty()    // 難易度別正答率（キャッシュ: 2時間）
getWeakAreas()               // 弱点分析（キャッシュ: 2時間）
getAnalyticsSummary()        // サマリー統計（キャッシュ: 1時間）
```

### 単語学習 (src/actions/vocabulary.ts)
```typescript
getVocabulary(options)       // 単語一覧取得（レベル/カテゴリ別）
getTodayReviewVocabulary()   // 今日の復習単語
getUnlearnedVocabulary()     // 未学習の単語
recordVocabularyResult()     // 学習結果を記録
getVocabularyStats()         // 単語統計
getVocabularyStatsByLevel()  // レベル別統計
```

### 文法問題 (src/actions/grammar.ts)
```typescript
getGrammarQuestions(options)     // 文法問題一覧
getRandomGrammarQuestions()      // ランダム問題取得
submitGrammarAnswer()            // 回答送信
getGrammarStatsByCategory()      // カテゴリ別統計
getIncorrectGrammarQuestions()   // 間違えた問題
getGrammarStats()                // 文法統計
getGrammarQuestionCount()        // カテゴリ別問題数
```

### 復習 (src/actions/review.ts)
```typescript
addBookmark()                         // ブックマーク追加
removeBookmark()                      // ブックマーク削除
getBookmarks()                        // ブックマーク一覧
getTodayReviewSchedule()              // 今日の復習スケジュール
completeReviewItem()                  // 復習完了
generateReviewScheduleFromMistakes() // 復習スケジュール自動生成
```

### 時間管理 (src/actions/timer.ts)
```typescript
getTimeStats()         // 時間統計
getTimeOverruns()      // 時間超過率
getTotalStudyTime()    // 総学習時間
```

### 模試 (src/actions/mock-exam.ts)
```typescript
startMockExam(type)              // 模試を開始
getMockExam(examId)              // 模試情報を取得
getMockExamQuestions(examId)     // 模試の問題一覧を取得
submitMockExamAnswer(...)        // 回答を送信
completeMockExam(examId)         // 模試を完了
abandonMockExam(examId)          // 模試を中断
getInProgressMockExam()          // 進行中の模試を取得
getMockExamResults()             // 模試結果一覧を取得
getMockExamResult(examId)        // 単一の模試結果を取得
```

### AI生成 (src/actions/ai/)
```typescript
// generate-passage.ts
generatePassage(request)            // AI長文生成
saveGeneratedPassage(passage, meta) // 保存

// generate-grammar.ts
generateGrammarQuestions(request)       // AI文法問題生成
saveGeneratedGrammarQuestions(questions) // 保存

// generate-vocabulary.ts
generateVocabulary(request)         // AI単語生成
saveGeneratedVocabulary(vocabulary) // 保存
```

## 開発フェーズ

### Phase 1: MVP（完了）
- [x] 要件定義書作成
- [x] MVP設計書作成
- [x] 実装プラン作成
- [x] プロジェクトセットアップ
- [x] ユーザー認証
- [x] 長文読解機能
- [x] ダッシュボード
- [x] シードデータ投入

### Phase 2: AI統合（完了）
- [x] GPT-4による問題生成API
- [x] 長文問題の自動生成（管理者専用）
- [x] 文法問題の自動生成
- [x] 単語の自動生成

### Phase 3: 学習管理 + Google認証（完了）
- [x] Google OAuth認証
- [x] 進捗記録の拡張（日別/カテゴリ別統計ビュー）
- [x] 正答率グラフ（recharts）
- [x] 弱点分析

### Phase 4: 単語・文法・復習・時間管理（完了）
- [x] 単語学習機能（フラッシュカード、レベル別学習）
- [x] 文法学習機能（Part5/6形式、カテゴリ別練習）
- [x] 復習機能（ブックマーク、復習スケジュール）
- [x] 時間制限機能（タイマー、推奨時間表示）
- [x] 間隔反復学習（忘却曲線に基づく復習スケジュール）

### Phase 5: 模試・AI生成UI・PWA・最適化（完了）
- [x] 文法・単語AI生成UI（管理者画面にタブ追加）
- [x] 模試機能（フル模試100問、ミニ模試15分/30分）
- [x] PWA対応（manifest.json、next-pwa、アイコン）
- [x] パフォーマンス最適化
  - [x] unstable_cache によるサーバーサイドキャッシュ
  - [x] 動的インポート（チャートコンポーネント）
  - [x] React.memo + useMemo によるメモ化
  - [x] Promise.all 最適化

## キャッシュ戦略

### キャッシュ設定 (src/lib/cache.ts)
```typescript
export const CACHE_TIMES = {
  SHORT: 900,        // 15分
  MEDIUM: 1800,      // 30分
  LONG: 3600,        // 1時間
  VERY_LONG: 7200,   // 2時間
  EXTRA_LONG: 14400, // 4時間
} as const

export const CACHE_TAGS = {
  ANALYTICS: "analytics",
  DASHBOARD: "dashboard",
  VOCABULARY: "vocabulary",
  GRAMMAR: "grammar",
  MOCK_EXAM: "mock-exam",
} as const
```

### Supabaseクライアントの使い分け
```typescript
// 通常のServer Actions（cookies依存）
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// unstable_cache内で使用（Service Role Key、cookies非依存）
import { createServiceClient } from "@/lib/supabase/server"
const supabase = createServiceClient()
```

### キャッシュパターン
```typescript
// 認証チェック後にキャッシュされた実装を呼び出す
export async function getDailyAccuracy(days: number = 30): Promise<DailyStats[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return unstable_cache(
    () => getDailyAccuracyImpl(user.id, days),  // Service Clientを使用
    [`daily-accuracy-${user.id}-${days}`],
    {
      revalidate: CACHE_TIMES.EXTRA_LONG,
      tags: [CACHE_TAGS.ANALYTICS, `user-${user.id}`]
    }
  )()
}
```

## コーディング規約

### コンポーネント
- 関数コンポーネント + TypeScript
- Props型は `interface` で定義
- ファイル名は PascalCase（例: `LoginForm.tsx`）
- クライアントコンポーネントは `"use client"` を先頭に
- パフォーマンス重視のコンポーネントは `React.memo` + `useMemo` を使用

### Server Actions
- `src/actions/` に配置
- `"use server"` ディレクティブを使用
- 認証チェックは各アクション内で `await supabase.auth.getUser()`
- キャッシュ対応の場合は Impl 関数を分離し、createServiceClient を使用

### スタイリング
- Tailwind CSS のユーティリティクラスを使用
- shadcn/ui コンポーネントを優先的に使用
- `cn()` ヘルパーでクラス結合
- カスタムスタイルは最小限に

### 命名規則
| 対象 | 規則 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `getPassages`, `isLoading` |
| 型・インターフェース | PascalCase | `ReadingPassage`, `UserAnswer` |
| 定数 | UPPER_SNAKE_CASE | `DOCUMENT_TYPES`, `APP_NAME` |
| コンポーネントファイル | PascalCase | `LoginForm.tsx` |
| ページファイル | kebab-case | `page.tsx`, `layout.tsx` |

## セキュリティ

- **RLS**: 全テーブルでRow Level Security有効
- **認証**: Middleware で保護パスをチェック
- **Service Role Key**: unstable_cache内でのみ使用、userIdを明示的に指定
- **環境変数**: `.env.local` で管理、`.gitignore` に追加
- **HTTPS**: 本番環境では必須

## 保護されるパス

```typescript
// src/middleware.ts
const protectedPaths = [
  '/dashboard', '/reading', '/results', '/admin',
  '/analytics', '/grammar', '/vocabulary', '/review', '/mock-exam'
]
const authPaths = ['/login', '/register']
```

## 管理者機能

### 管理者画面
- `/admin` - 管理ダッシュボード
- `/admin/generate` - AI問題生成（タブ切替: 長文/文法/単語）

### AI生成UI
- **長文タブ**: 文書タイプ、難易度、設問数を指定して生成
- **文法タブ**: カテゴリ、難易度、生成数を指定して生成
- **単語タブ**: レベル、カテゴリ、生成数を指定して生成

## PWA設定

### manifest.json
```json
{
  "name": "TOEIC Part7 トレーニング",
  "short_name": "TOEIC学習",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6"
}
```

### next.config.ts
```typescript
import withPWA from "next-pwa"

const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({ /* 既存設定 */ })
```

## 参考ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [docs/requirements.md](docs/requirements.md) | 機能要件定義書（全機能の詳細） |
| [docs/mvp-design.md](docs/mvp-design.md) | MVP設計書（DB設計、画面設計、API設計） |
| [docs/mvp-implementation-plan.md](docs/mvp-implementation-plan.md) | MVP実装プラン（コード付き手順書） |
| [docs/phase5-implementation-plan.md](docs/phase5-implementation-plan.md) | Phase 5実装プラン（模試、AI生成UI、PWA、最適化） |

## クイックリファレンス

### Supabaseクライアント取得
```typescript
// サーバーサイド（通常）
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// サーバーサイド（キャッシュ内、RLSバイパス）
import { createServiceClient } from "@/lib/supabase/server"
const supabase = createServiceClient()

// クライアントサイド
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
```

### 認証チェック
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return null
```

### データ取得
```typescript
const { data, error } = await supabase
  .from("reading_passages")
  .select("*")
  .order("created_at", { ascending: false })
```

### 動的インポート（チャート）
```typescript
import dynamic from "next/dynamic"

const AccuracyChart = dynamic(
  () => import("@/components/analytics/AccuracyChart").then(mod => ({ default: mod.AccuracyChart })),
  { loading: () => <Skeleton className="h-[300px]" />, ssr: false }
)
```
