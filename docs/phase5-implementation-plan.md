# Phase 5 + AI生成UI 実装計画

## 概要

TOEIC Part7トレーニングWebサービスのPhase 5機能と文法・単語AI生成UIを実装します。

### 実装内容
1. **文法・単語AI生成UI** - 管理者画面にタブを追加
2. **模試機能** - 複合模試（Part5/6/7の100問形式）
3. **PWA対応** - オフライン対応とインストール可能なアプリ化
4. **パフォーマンス最適化** - キャッシュ戦略、動的インポート

---

## 1. 文法・単語AI生成UI

### 現状
- バックエンド実装済み: `src/actions/ai/generate-grammar.ts`, `src/actions/ai/generate-vocabulary.ts`
- 保存関数も実装済み: `saveGeneratedGrammarQuestions`, `saveGeneratedVocabulary`
- 管理者画面 `/admin/generate` は長文生成のみ対応

### 実装タスク

#### 1.1 タブUI追加
**ファイル**: `src/app/(admin)/admin/generate/page.tsx`

```typescript
// タブを追加して長文・文法・単語を切り替え可能に
<Tabs defaultValue="passage">
  <TabsList>
    <TabsTrigger value="passage">長文読解</TabsTrigger>
    <TabsTrigger value="grammar">文法問題</TabsTrigger>
    <TabsTrigger value="vocabulary">単語</TabsTrigger>
  </TabsList>
  <TabsContent value="passage">/* 既存のPassageGenerator */</TabsContent>
  <TabsContent value="grammar"><GrammarGenerator /></TabsContent>
  <TabsContent value="vocabulary"><VocabularyGenerator /></TabsContent>
</Tabs>
```

#### 1.2 GrammarGenerator コンポーネント
**新規作成**: `src/components/admin/GrammarGenerator.tsx`

**機能**:
- カテゴリ選択（10種類: 品詞、時制、関係詞、接続詞、前置詞、仮定法、受動態、比較、冠詞、代名詞）
- 難易度選択（1-5）
- 生成数入力（1-10問）
- フォーカスエリア入力（任意: 例「仮定法過去完了」）
- プレビュー表示（正解をハイライト、解説表示）
- 保存ボタン

**使用するServer Actions**:
```typescript
import { generateGrammarQuestions, saveGeneratedGrammarQuestions } from "@/actions/ai/generate-grammar"
```

#### 1.3 VocabularyGenerator コンポーネント
**新規作成**: `src/components/admin/VocabularyGenerator.tsx`

**機能**:
- レベル選択（1: 600点, 2: 700点, 3: 800点, 4: 900点）
- カテゴリ選択（7種類: business, finance, marketing, hr, technology, travel, general）
- 生成数入力（1-20語）
- トピック入力（任意: 例「会議、プレゼンテーション」）
- プレビュー表示（単語、意味、発音、例文、類義語）
- 保存ボタン

**使用するServer Actions**:
```typescript
import { generateVocabulary, saveGeneratedVocabulary } from "@/actions/ai/generate-vocabulary"
```

---

## 2. 模試機能

### 仕様

#### 模試タイプ
| タイプ | Part5 | Part6 | Part7 | 合計 | 制限時間 |
|--------|-------|-------|-------|------|----------|
| フル模試 | 30問 | 16問 | 54問 | 100問 | 75分 |
| ミニ模試30分 | 15問 | 4問 | 10問 | 29問 | 30分 |
| ミニ模試15分 | 10問 | 0問 | 5問 | 15問 | 15分 |

#### 出題方式
- **ハイブリッド方式**: 既存DBから優先的に出題、不足分はAI生成
- Part5: `grammar_questions` テーブルからランダム選択
- Part6: `grammar_questions` + `reading_passages`（短いパッセージ）
- Part7: `reading_passages` + `reading_questions` からセット選択

### 2.1 DBスキーマ
**新規マイグレーション**: `supabase/migrations/008_add_mock_exam.sql`

```sql
-- =====================================================
-- 模試テーブル
-- =====================================================
CREATE TABLE mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('full', 'mini_15', 'mini_30')),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  time_limit_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_exams_user ON mock_exams(user_id);
CREATE INDEX idx_mock_exams_status ON mock_exams(user_id, status);

-- =====================================================
-- 模試問題テーブル（各模試に紐づく問題）
-- =====================================================
CREATE TABLE mock_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  part VARCHAR(10) NOT NULL CHECK (part IN ('part5', 'part6', 'part7')),
  question_type VARCHAR(20) NOT NULL, -- 'grammar' or 'reading'
  question_id UUID NOT NULL, -- grammar_questions.id or reading_questions.id
  passage_id UUID, -- reading_passages.id (Part6/7のみ)
  order_index INTEGER NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_exam_questions_exam ON mock_exam_questions(mock_exam_id);
CREATE INDEX idx_mock_exam_questions_order ON mock_exam_questions(mock_exam_id, order_index);

-- =====================================================
-- 模試回答テーブル
-- =====================================================
CREATE TABLE mock_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  mock_question_id UUID NOT NULL REFERENCES mock_exam_questions(id) ON DELETE CASCADE,
  selected_answer VARCHAR(1), -- NULL if not answered
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mock_exam_id, mock_question_id)
);

CREATE INDEX idx_mock_exam_answers_exam ON mock_exam_answers(mock_exam_id);

-- =====================================================
-- 模試結果テーブル（サマリー）
-- =====================================================
CREATE TABLE mock_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  part5_total INTEGER DEFAULT 0,
  part5_correct INTEGER DEFAULT 0,
  part6_total INTEGER DEFAULT 0,
  part6_correct INTEGER DEFAULT 0,
  part7_total INTEGER DEFAULT 0,
  part7_correct INTEGER DEFAULT 0,
  total_time_seconds INTEGER NOT NULL,
  estimated_score INTEGER, -- 予測スコア (200-990)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_exam_results_user ON mock_exam_results(user_id);

-- =====================================================
-- RLSポリシー
-- =====================================================

ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exams" ON mock_exams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock exams" ON mock_exams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock exams" ON mock_exams
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE mock_exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exam questions" ON mock_exam_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own mock exam questions" ON mock_exam_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
  );

ALTER TABLE mock_exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mock exam answers" ON mock_exam_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM mock_exams me
            JOIN mock_exam_questions meq ON meq.mock_exam_id = me.id
            WHERE meq.id = mock_question_id AND me.user_id = auth.uid())
  );

ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exam results" ON mock_exam_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock exam results" ON mock_exam_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2.2 型定義
**新規作成**: `src/types/mock-exam.ts`

```typescript
export type MockExamType = "full" | "mini_15" | "mini_30"
export type MockExamStatus = "in_progress" | "completed" | "abandoned"

export interface MockExam {
  id: string
  user_id: string
  exam_type: MockExamType
  status: MockExamStatus
  time_limit_minutes: number
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface MockExamQuestion {
  id: string
  mock_exam_id: string
  part: "part5" | "part6" | "part7"
  question_type: "grammar" | "reading"
  question_id: string
  passage_id: string | null
  order_index: number
  is_ai_generated: boolean
  created_at: string
}

export interface MockExamAnswer {
  id: string
  mock_exam_id: string
  mock_question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  time_spent_seconds: number | null
  answered_at: string | null
  created_at: string
}

export interface MockExamResult {
  id: string
  mock_exam_id: string
  user_id: string
  total_questions: number
  correct_count: number
  part5_total: number
  part5_correct: number
  part6_total: number
  part6_correct: number
  part7_total: number
  part7_correct: number
  total_time_seconds: number
  estimated_score: number
  created_at: string
}

export interface MockExamConfig {
  type: MockExamType
  label: string
  timeLimit: number // minutes
  part5Count: number
  part6Count: number
  part7Count: number
}

export const MOCK_EXAM_CONFIGS: Record<MockExamType, MockExamConfig> = {
  full: {
    type: "full",
    label: "フル模試",
    timeLimit: 75,
    part5Count: 30,
    part6Count: 16,
    part7Count: 54,
  },
  mini_30: {
    type: "mini_30",
    label: "ミニ模試 30分",
    timeLimit: 30,
    part5Count: 15,
    part6Count: 4,
    part7Count: 10,
  },
  mini_15: {
    type: "mini_15",
    label: "ミニ模試 15分",
    timeLimit: 15,
    part5Count: 10,
    part6Count: 0,
    part7Count: 5,
  },
}
```

### 2.3 Server Actions
**新規作成**: `src/actions/mock-exam.ts`

| 関数 | 説明 |
|------|------|
| `startMockExam(type: MockExamType)` | 模試を開始、問題を収集・登録、examIdを返す |
| `getMockExam(examId: string)` | 模試情報を取得 |
| `getMockExamQuestions(examId: string)` | 模試の問題一覧を取得（関連データ含む） |
| `submitMockExamAnswer(examId, questionId, answer, timeSpent)` | 回答を送信、正解判定 |
| `completeMockExam(examId: string)` | 模試を完了、結果を集計・保存 |
| `abandonMockExam(examId: string)` | 模試を中断 |
| `getMockExamResults()` | ユーザーの模試結果一覧を取得 |
| `getMockExamResult(examId: string)` | 単一の模試結果を取得（詳細分析付き） |
| `getInProgressMockExam()` | 進行中の模試があれば取得 |

### 2.4 UI構成

```
src/app/(main)/mock-exam/
├── page.tsx              # 模試選択・開始画面
├── [id]/
│   ├── page.tsx          # 模試実行画面
│   └── result/page.tsx   # 結果画面
└── history/page.tsx      # 履歴一覧

src/components/mock-exam/
├── MockExamSelector.tsx  # タイプ選択カード
├── MockExamSession.tsx   # セッション管理（状態管理の中心）
├── MockExamTimer.tsx     # カウントダウンタイマー
├── MockExamQuestion.tsx  # 問題表示（Part5/6/7対応）
├── MockExamProgress.tsx  # 進捗表示（問題番号グリッド）
├── MockExamResult.tsx    # 結果サマリー
├── MockExamResultDetail.tsx  # 問題別の詳細結果
└── MockExamHistory.tsx   # 履歴リスト
```

#### 主要コンポーネント設計

**MockExamSession.tsx** - 模試全体の状態管理
```typescript
interface Props {
  examId: string
  questions: MockExamQuestionWithData[]
  timeLimit: number // minutes
}

// 状態
- currentIndex: number (現在の問題番号)
- answers: Record<string, string> (questionId -> 選択した回答)
- questionStartTime: number (現在の問題を開始した時刻)
- isSubmitting: boolean

// 機能
- 問題の表示・切り替え
- 回答の記録・送信
- タイマー連携（時間切れで自動提出）
- 問題ナビゲーション（番号クリックで移動）
```

**MockExamTimer.tsx** - カウントダウンタイマー
```typescript
interface Props {
  totalMinutes: number
  onTimeUp: () => void
  startTime: Date
}

// 表示: MM:SS 形式
// 残り5分で警告色に変更
// 時間切れでonTimeUp呼び出し
```

---

## 3. PWA対応

### 3.1 パッケージ追加
```bash
npm install next-pwa
```

### 3.2 設定ファイル

**next.config.ts** 修正:
```typescript
import type { NextConfig } from "next"
import withPWA from "next-pwa"

const nextConfig: NextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({
  // 既存の設定
})

export default nextConfig
```

**public/manifest.json** 新規作成:
```json
{
  "name": "TOEIC Part7 トレーニング",
  "short_name": "TOEIC学習",
  "description": "TOEIC Part7対策のトレーニングアプリ",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**src/app/layout.tsx** 修正:
```typescript
export const metadata: Metadata = {
  title: "TOEIC Part7 トレーニング",
  description: "TOEIC Part7で90%の正解率を目指すトレーニングアプリ",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TOEIC学習",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}
```

### 3.3 アイコン作成
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`
- `public/icons/apple-touch-icon.png` (180x180)

---

## 4. パフォーマンス最適化

### 4.1 キャッシュ戦略

**unstable_cache の活用**:
```typescript
import { unstable_cache } from "next/cache"

// 問題一覧のキャッシュ（10分）
export const getCachedPassages = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from("reading_passages")
      .select("id, title, document_type, difficulty")
      .order("created_at", { ascending: false })
    return data
  },
  ["passages-list"],
  { revalidate: 600 }
)

// 統計データのキャッシュ（5分）
export const getCachedStats = unstable_cache(
  async (userId: string) => {
    // 統計計算
  },
  ["user-stats"],
  { revalidate: 300, tags: ["stats"] }
)
```

### 4.2 動的インポート

**重いコンポーネントの遅延ロード**:
```typescript
import dynamic from "next/dynamic"

// グラフコンポーネント
const AccuracyChart = dynamic(
  () => import("@/components/analytics/AccuracyChart"),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false
  }
)

// 模試セッション（クライアントのみ）
const MockExamSession = dynamic(
  () => import("@/components/mock-exam/MockExamSession"),
  { ssr: false }
)
```

### 4.3 並列データフェッチ

```typescript
// ダッシュボードページの例
export default async function DashboardPage() {
  const [stats, recentActivity, reviewSchedule] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(5),
    getTodayReviewSchedule(),
  ])

  return (...)
}
```

### 4.4 画像最適化

```typescript
import Image from "next/image"

// 自動的にWebP/AVIF変換、サイズ最適化
<Image
  src="/images/hero.png"
  alt="Hero"
  width={800}
  height={400}
  priority // LCPに影響する画像
/>
```

### 4.5 Lighthouse目標スコア

| 項目 | 現状（推定） | 目標 |
|------|-------------|------|
| Performance | 70-80 | 90+ |
| Accessibility | 85-90 | 95+ |
| Best Practices | 90 | 95+ |
| SEO | 85 | 90+ |

---

## 実装順序

### Phase 5-A: AI生成UI（優先度: 高）
| 順序 | タスク | ファイル |
|------|--------|----------|
| 1 | タブUI追加 | `src/app/(admin)/admin/generate/page.tsx` |
| 2 | GrammarGenerator作成 | `src/components/admin/GrammarGenerator.tsx` |
| 3 | VocabularyGenerator作成 | `src/components/admin/VocabularyGenerator.tsx` |
| 4 | 動作確認 | - |

### Phase 5-B: 模試DB・バックエンド（優先度: 高）
| 順序 | タスク | ファイル |
|------|--------|----------|
| 1 | マイグレーション作成 | `supabase/migrations/008_add_mock_exam.sql` |
| 2 | 型定義作成 | `src/types/mock-exam.ts` |
| 3 | Server Actions作成 | `src/actions/mock-exam.ts` |
| 4 | middleware更新 | `src/middleware.ts` |

### Phase 5-C: 模試UI（優先度: 高）
| 順序 | タスク | ファイル |
|------|--------|----------|
| 1 | 模試選択画面 | `src/app/(main)/mock-exam/page.tsx` |
| 2 | MockExamSelector | `src/components/mock-exam/MockExamSelector.tsx` |
| 3 | MockExamTimer | `src/components/mock-exam/MockExamTimer.tsx` |
| 4 | MockExamQuestion | `src/components/mock-exam/MockExamQuestion.tsx` |
| 5 | MockExamProgress | `src/components/mock-exam/MockExamProgress.tsx` |
| 6 | MockExamSession | `src/components/mock-exam/MockExamSession.tsx` |
| 7 | 模試実行画面 | `src/app/(main)/mock-exam/[id]/page.tsx` |
| 8 | MockExamResult | `src/components/mock-exam/MockExamResult.tsx` |
| 9 | 結果画面 | `src/app/(main)/mock-exam/[id]/result/page.tsx` |
| 10 | MockExamHistory | `src/components/mock-exam/MockExamHistory.tsx` |
| 11 | 履歴画面 | `src/app/(main)/mock-exam/history/page.tsx` |

### Phase 5-D: PWA対応（優先度: 中）
| 順序 | タスク | ファイル |
|------|--------|----------|
| 1 | next-pwaインストール | `package.json` |
| 2 | next.config.ts更新 | `next.config.ts` |
| 3 | manifest.json作成 | `public/manifest.json` |
| 4 | アイコン作成 | `public/icons/` |
| 5 | layout.tsx更新 | `src/app/layout.tsx` |

### Phase 5-E: パフォーマンス最適化（優先度: 中）
| 順序 | タスク | ファイル |
|------|--------|----------|
| 1 | Lighthouse計測 | - |
| 2 | キャッシュ実装 | 各actions |
| 3 | 動的インポート適用 | 各ページ |
| 4 | 再計測・調整 | - |

---

## ファイル一覧

### 新規作成ファイル
```
src/components/admin/GrammarGenerator.tsx
src/components/admin/VocabularyGenerator.tsx
src/types/mock-exam.ts
src/actions/mock-exam.ts
src/app/(main)/mock-exam/page.tsx
src/app/(main)/mock-exam/[id]/page.tsx
src/app/(main)/mock-exam/[id]/result/page.tsx
src/app/(main)/mock-exam/history/page.tsx
src/components/mock-exam/MockExamSelector.tsx
src/components/mock-exam/MockExamSession.tsx
src/components/mock-exam/MockExamTimer.tsx
src/components/mock-exam/MockExamQuestion.tsx
src/components/mock-exam/MockExamProgress.tsx
src/components/mock-exam/MockExamResult.tsx
src/components/mock-exam/MockExamResultDetail.tsx
src/components/mock-exam/MockExamHistory.tsx
supabase/migrations/008_add_mock_exam.sql
public/manifest.json
public/icons/icon-192x192.png
public/icons/icon-512x512.png
public/icons/apple-touch-icon.png
```

### 修正ファイル
```
src/app/(admin)/admin/generate/page.tsx  # タブUI追加
src/middleware.ts                         # /mock-exam パス保護追加
next.config.ts                            # PWA設定追加
src/app/layout.tsx                        # manifest、themeColor追加
```

---

## 検証方法

### AI生成UI
1. 管理者アカウントで `/admin/generate` にアクセス
2. 「文法問題」タブを選択
3. カテゴリ「品詞」、難易度「3」、生成数「5」を設定
4. 「生成」ボタンをクリック
5. プレビューで問題内容を確認（正解がハイライトされている）
6. 「保存」ボタンをクリック
7. `/grammar` ページで生成した問題が表示されることを確認
8. 同様に「単語」タブでも検証

### 模試機能
1. `/mock-exam` にアクセス
2. 「ミニ模試15分」を選択して「開始」
3. タイマーが動作していることを確認
4. 問題に回答（Part5形式）
5. 問題番号をクリックして移動できることを確認
6. 全問回答後「提出」をクリック
7. 結果画面で以下を確認:
   - 正答率（全体、Part別）
   - 予測スコア
   - 所要時間
8. `/mock-exam/history` で履歴が表示されることを確認

### PWA
1. Chrome DevTools > Application > Manifest
   - manifest.jsonが正しく読み込まれている
2. Application > Service Workers
   - Service Workerが登録されている
3. モバイルデバイスで:
   - 「ホーム画面に追加」プロンプトが表示される
   - インストール後、スタンドアロンで起動する

### パフォーマンス
1. `npm run build && npm run start`
2. Chrome DevTools > Lighthouse
3. 各指標が目標値を満たしていることを確認
4. Core Web Vitals (LCP, FID, CLS) が良好な範囲内

---

## 注意事項

### セキュリティ
- 模試データは全てRLSで保護（自分のデータのみアクセス可能）
- AI生成機能は管理者のみ使用可能（`requireAdmin()`でチェック）

### エラーハンドリング
- 模試中のネットワークエラー: 回答をローカルストレージに一時保存、再接続時に同期
- AI生成失敗: エラーメッセージを表示、再試行ボタンを提供

### 拡張性
- 模試タイプは`MOCK_EXAM_CONFIGS`に追加するだけで拡張可能
- 将来的にPart1-4対応も想定したDB設計
