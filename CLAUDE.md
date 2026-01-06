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
| 認証 | Supabase Auth |
| AI | OpenAI GPT-4 API（Phase 2以降） |
| デプロイ | Vercel |

## ディレクトリ構成

```
toeic_part7/
├── CLAUDE.md                      # このファイル
├── docs/                          # ドキュメント
│   ├── requirements.md            # 機能要件定義書
│   ├── mvp-design.md              # MVP設計書
│   └── mvp-implementation-plan.md # MVP実装プラン
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # 認証グループ
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/               # メイングループ（認証必須）
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── reading/
│   │   │   │   ├── page.tsx      # 問題一覧
│   │   │   │   └── [id]/page.tsx # 問題詳細
│   │   │   ├── results/page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx              # ランディングページ
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   ├── auth/                 # LoginForm, RegisterForm
│   │   ├── reading/              # PassageCard, QuestionView
│   │   ├── dashboard/            # StatsCard, RecentActivityList
│   │   └── layout/               # Header, Sidebar, MobileNav
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # ブラウザ用
│   │   │   └── server.ts         # サーバー用
│   │   ├── utils.ts              # cn() ヘルパー
│   │   └── constants.ts          # 定数定義
│   ├── hooks/                    # カスタムフック
│   ├── types/
│   │   └── database.ts           # DB型定義
│   ├── actions/
│   │   ├── auth.ts               # 認証アクション
│   │   ├── reading.ts            # 長文読解アクション
│   │   └── progress.ts           # 進捗アクション
│   └── middleware.ts             # 認証Middleware
├── supabase/
│   ├── migrations/               # DBマイグレーション
│   │   └── 001_create_tables.sql
│   └── seed.sql                  # 初期データ
├── public/
├── .env.local                    # 環境変数（Git管理外）
├── .env.local.example            # 環境変数テンプレート
├── next.config.js
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
```

## 型定義

```typescript
// 文書タイプ
type DocumentType = 'email' | 'article' | 'notice' | 'advertisement' | 'letter' | 'chat' | 'form' | 'review'

// 設問タイプ
type QuestionType = 'main_idea' | 'detail' | 'inference' | 'vocabulary' | 'purpose'

// 主要インターフェース
interface Profile { id, email, name, target_score, current_score, ... }
interface ReadingPassage { id, title, document_type, content, difficulty, ... }
interface ReadingQuestion { id, passage_id, question_text, options[], correct_answer, ... }
interface UserAnswer { id, user_id, question_id, selected_answer, is_correct, ... }
```

## 開発コマンド

```bash
# プロジェクト作成（初回のみ）
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# パッケージインストール
npm install @supabase/supabase-js @supabase/ssr
npm install clsx tailwind-merge lucide-react

# shadcn/ui セットアップ
npx shadcn@latest init
npx shadcn@latest add button card input label form toast avatar dropdown-menu tabs progress skeleton radio-group

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint

# 型チェック
npx tsc --noEmit
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

### 進捗 (src/actions/progress.ts)
```typescript
getDashboardStats()      // ダッシュボード統計
getRecentActivity(limit) // 最近の学習履歴
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
- [ ] 文法問題の自動生成（後回し）

### Phase 3: 学習管理
- [ ] 進捗記録の拡張
- [ ] 正答率グラフ
- [ ] 弱点分析

### Phase 4: 復習・時間管理
- [ ] 復習機能
- [ ] 時間制限機能
- [ ] 間隔反復学習

### Phase 5: 模試・最適化
- [ ] 模試機能
- [ ] PWA対応
- [ ] パフォーマンス最適化

## コーディング規約

### コンポーネント
- 関数コンポーネント + TypeScript
- Props型は `interface` で定義
- ファイル名は PascalCase（例: `LoginForm.tsx`）
- クライアントコンポーネントは `"use client"` を先頭に

### Server Actions
- `src/actions/` に配置
- `"use server"` ディレクティブを使用
- 認証チェックは各アクション内で `await supabase.auth.getUser()`

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
- **認証**: Middleware で保護パスをチェック (`/dashboard`, `/reading`, `/results`)
- **環境変数**: `.env.local` で管理、`.gitignore` に追加
- **HTTPS**: 本番環境では必須

## 保護されるパス

```typescript
// src/middleware.ts
const protectedPaths = ['/dashboard', '/reading', '/results', '/admin']
const authPaths = ['/login', '/register']
```

## 管理者機能（Phase 2）

### 管理者画面
- `/admin` - 管理ダッシュボード
- `/admin/generate` - AI問題生成

### AI生成 Server Actions (src/actions/ai/)
```typescript
isAdmin()                           // 管理者チェック
requireAdmin()                      // 管理者必須チェック
generatePassage(request)            // AI長文生成
saveGeneratedPassage(passage, meta) // 生成した長文を保存
generateQuestions(request)          // AI設問生成
saveGeneratedQuestions(id, questions) // 生成した設問を保存
```

### 環境変数（Phase 2追加）
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000
```

## 参考ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [docs/requirements.md](docs/requirements.md) | 機能要件定義書（全機能の詳細） |
| [docs/mvp-design.md](docs/mvp-design.md) | MVP設計書（DB設計、画面設計、API設計） |
| [docs/mvp-implementation-plan.md](docs/mvp-implementation-plan.md) | MVP実装プラン（コード付き手順書） |

## クイックリファレンス

### Supabaseクライアント取得
```typescript
// サーバーサイド
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

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
