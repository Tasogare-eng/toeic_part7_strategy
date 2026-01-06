# Phase 2: AI統合 実装プラン

## 概要
OpenAI GPT-4 APIを統合し、TOEIC Part7形式の長文問題・設問を自動生成する機能を実装。
- **利用者**: 管理者のみ（一般ユーザーは生成された問題を解く）
- **文法問題（Part5/6）**: Phase 2では後回し、長文問題生成を優先

---

## 実装ステップ

### Step 1: 基盤整備

**1.1 パッケージインストール**
```bash
npm install openai
```

**1.2 環境変数追加** (`.env.local`)
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000
```

**1.3 新規ファイル作成**
- `src/lib/openai/client.ts` - OpenAIクライアント初期化
- `src/lib/openai/errors.ts` - エラーハンドリング
- `src/types/ai-generation.ts` - AI生成用型定義

### Step 2: データベース更新

**2.1 既存テーブル変更** (`supabase/migrations/002_add_ai_columns.sql`)
```sql
ALTER TABLE public.reading_passages
ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_metadata JSONB;

ALTER TABLE public.reading_questions
ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE;
```

**2.2 管理者テーブル** (`supabase/migrations/003_add_admin.sql`)
```sql
ALTER TABLE public.profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

### Step 3: プロンプト設計

**3.1 長文生成プロンプト** (`src/lib/openai/prompts/passage.ts`)
- 8種類のDocumentType別ガイドライン
- 5段階の難易度別指示
- JSON形式での出力指定

**3.2 設問生成プロンプト** (`src/lib/openai/prompts/questions.ts`)
- 5種類のQuestionType別ガイドライン
- 4択問題の生成ルール
- 解説付き出力

### Step 4: Server Actions実装

**4.1 長文生成** (`src/actions/ai/generate-passage.ts`)
```typescript
export async function generatePassage(request: PassageGenerationRequest)
```

**4.2 設問生成** (`src/actions/ai/generate-questions.ts`)
```typescript
export async function generateQuestions(request: QuestionGenerationRequest)
```

**4.3 管理者チェック** (`src/actions/ai/admin.ts`)
```typescript
export async function isAdmin(userId: string): Promise<boolean>
```

### Step 5: 管理画面UI

**5.1 ディレクトリ構成**
```
src/app/(admin)/
  layout.tsx
  admin/
    page.tsx              # 管理ダッシュボード
    generate/page.tsx     # 問題生成画面
    review/page.tsx       # レビュー画面
```

**5.2 コンポーネント**
- `src/components/admin/PassageGenerator.tsx`
- `src/components/admin/QuestionGenerator.tsx`

---

## 新規ファイル一覧

```
src/
  lib/
    openai/
      client.ts
      errors.ts
      prompts/
        passage.ts
        questions.ts
  types/
    ai-generation.ts
  actions/
    ai/
      generate-passage.ts
      generate-questions.ts
      admin.ts
  app/
    (admin)/
      layout.tsx
      admin/
        page.tsx
        generate/page.tsx
  components/
    admin/
      PassageGenerator.tsx
      QuestionGenerator.tsx

supabase/
  migrations/
    002_add_ai_columns.sql
    003_add_admin.sql
```

---

## コスト見積もり

- GPT-4 Turbo: 約$0.01-0.03/1K tokens
- 1問題セット（passage + 4 questions）: 約$0.10-0.20
- 月間100問題生成: 約$10-20

---

## 重要な修正ファイル

1. `src/types/database.ts` - 型定義拡張（Profile型にis_admin追加）
2. `.env.local.example` - OpenAI環境変数追加
3. `src/middleware.ts` - 管理者ルート保護追加
4. `CLAUDE.md` - Phase 2完了マーク

---

## 注意事項

1. **APIキーセキュリティ**: サーバーサイドのみで使用
2. **管理者認証**: `/admin/*`へのアクセスは管理者のみ
3. **エラーハンドリング**: API障害時の適切なエラーメッセージ表示
