# Phase 4 実装プラン：単語・文法問題 + 復習・時間管理機能

## 概要

このドキュメントは、TOEIC Part7 トレーニングWebサービスのPhase 4実装プランです。
以下の機能を実装します：

1. **単語学習モジュール** - TOEIC頻出単語のフラッシュカード学習
2. **文法学習モジュール** - Part5/6形式の文法問題
3. **復習機能** - 間違えた問題の復習、ブックマーク
4. **時間制限機能** - 問題別タイマー、時間超過アラート
5. **間隔反復学習** - 忘却曲線に基づく復習スケジュール

---

## 1. データベース設計

### 1.1 新規テーブル

#### vocabulary（単語テーブル）
```sql
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL,
  meaning TEXT NOT NULL,
  pronunciation VARCHAR(200),
  part_of_speech VARCHAR(50), -- noun, verb, adjective, adverb, etc.
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4), -- 1:600点, 2:700点, 3:800点, 4:900点
  example_sentence TEXT,
  example_translation TEXT,
  category VARCHAR(100), -- business, finance, marketing, etc.
  synonyms TEXT[], -- 同義語配列
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_level ON vocabulary(level);
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
```

#### vocabulary_progress（単語学習進捗）
```sql
CREATE TABLE vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  familiarity INTEGER DEFAULT 0 CHECK (familiarity BETWEEN 0 AND 5), -- 0:未学習, 5:完全習得
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ, -- 間隔反復用
  review_interval_days INTEGER DEFAULT 1, -- 次回復習までの間隔
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

CREATE INDEX idx_vocab_progress_user ON vocabulary_progress(user_id);
CREATE INDEX idx_vocab_progress_next_review ON vocabulary_progress(next_review_at);
```

#### grammar_questions（文法問題テーブル）
```sql
CREATE TABLE grammar_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL, -- 問題文（空欄を含む）
  options JSONB NOT NULL, -- ["A) option1", "B) option2", "C) option3", "D) option4"]
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- parts_of_speech, tense, relative_clause, conjunction, preposition, etc.
  subcategory VARCHAR(100), -- 細分類
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  grammar_point TEXT, -- 文法ポイントの解説
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_category ON grammar_questions(category);
CREATE INDEX idx_grammar_difficulty ON grammar_questions(difficulty);
```

#### grammar_answers（文法問題回答履歴）
```sql
CREATE TABLE grammar_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES grammar_questions(id) ON DELETE CASCADE,
  selected_answer VARCHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_answers_user ON grammar_answers(user_id);
CREATE INDEX idx_grammar_answers_question ON grammar_answers(question_id);
CREATE INDEX idx_grammar_answers_date ON grammar_answers(answered_at);
```

#### bookmarks（ブックマーク）
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('vocabulary', 'grammar', 'reading')),
  item_id UUID NOT NULL,
  note TEXT, -- ユーザーのメモ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_type ON bookmarks(item_type);
```

#### review_schedule（復習スケジュール）
```sql
CREATE TABLE review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('vocabulary', 'grammar', 'reading')),
  item_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  priority INTEGER DEFAULT 1, -- 1:低, 2:中, 3:高
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id, scheduled_date)
);

CREATE INDEX idx_review_schedule_user_date ON review_schedule(user_id, scheduled_date);
CREATE INDEX idx_review_schedule_pending ON review_schedule(user_id, is_completed, scheduled_date);
```

### 1.2 RLSポリシー

```sql
-- vocabulary（全ユーザー読み取り可、管理者のみ書き込み可）
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vocabulary" ON vocabulary FOR SELECT USING (true);
CREATE POLICY "Admins can insert vocabulary" ON vocabulary FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update vocabulary" ON vocabulary FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- vocabulary_progress（自分のデータのみ）
ALTER TABLE vocabulary_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own vocabulary progress" ON vocabulary_progress
  FOR ALL USING (auth.uid() = user_id);

-- grammar_questions（全ユーザー読み取り可、管理者のみ書き込み可）
ALTER TABLE grammar_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read grammar questions" ON grammar_questions FOR SELECT USING (true);
CREATE POLICY "Admins can insert grammar questions" ON grammar_questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update grammar questions" ON grammar_questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- grammar_answers（自分のデータのみ）
ALTER TABLE grammar_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own grammar answers" ON grammar_answers
  FOR ALL USING (auth.uid() = user_id);

-- bookmarks（自分のデータのみ）
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- review_schedule（自分のデータのみ）
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own review schedule" ON review_schedule
  FOR ALL USING (auth.uid() = user_id);
```

### 1.3 分析用ビュー

```sql
-- 単語学習の日別統計
CREATE VIEW daily_vocabulary_stats AS
SELECT
  vp.user_id,
  DATE(vp.last_reviewed_at) as review_date,
  COUNT(*) as words_reviewed,
  SUM(CASE WHEN vp.familiarity >= 4 THEN 1 ELSE 0 END) as words_mastered,
  AVG(vp.familiarity) as avg_familiarity
FROM vocabulary_progress vp
WHERE vp.last_reviewed_at IS NOT NULL
GROUP BY vp.user_id, DATE(vp.last_reviewed_at);

-- 文法問題の日別統計
CREATE VIEW daily_grammar_stats AS
SELECT
  user_id,
  DATE(answered_at) as answer_date,
  COUNT(*) as total_answers,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 1) as accuracy,
  AVG(time_spent_seconds) as avg_time_seconds
FROM grammar_answers
GROUP BY user_id, DATE(answered_at);

-- 文法カテゴリ別統計
CREATE VIEW grammar_stats_by_category AS
SELECT
  ga.user_id,
  gq.category,
  COUNT(*) as total_answers,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(AVG(CASE WHEN ga.is_correct THEN 100.0 ELSE 0 END), 1) as accuracy
FROM grammar_answers ga
JOIN grammar_questions gq ON ga.question_id = gq.id
GROUP BY ga.user_id, gq.category;
```

---

## 2. 型定義

### 2.1 src/types/vocabulary.ts

```typescript
// 品詞タイプ
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'

// 単語レベル
export type VocabularyLevel = 1 | 2 | 3 | 4 // 600/700/800/900点

// 単語カテゴリ
export type VocabularyCategory =
  | 'business'
  | 'finance'
  | 'marketing'
  | 'hr'
  | 'technology'
  | 'travel'
  | 'general'

export interface Vocabulary {
  id: string
  word: string
  meaning: string
  pronunciation: string | null
  part_of_speech: PartOfSpeech | null
  level: VocabularyLevel
  example_sentence: string | null
  example_translation: string | null
  category: VocabularyCategory | null
  synonyms: string[] | null
  is_ai_generated: boolean
  ai_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface VocabularyProgress {
  id: string
  user_id: string
  vocabulary_id: string
  familiarity: number // 0-5
  correct_count: number
  incorrect_count: number
  last_reviewed_at: string | null
  next_review_at: string | null
  review_interval_days: number
  created_at: string
  updated_at: string
}

export interface VocabularyWithProgress extends Vocabulary {
  progress: VocabularyProgress | null
}

// フラッシュカード用
export interface FlashcardState {
  currentIndex: number
  isFlipped: boolean
  direction: 'en-to-ja' | 'ja-to-en'
}
```

### 2.2 src/types/grammar.ts

```typescript
// 文法カテゴリ
export type GrammarCategory =
  | 'parts_of_speech'   // 品詞
  | 'tense'             // 時制
  | 'relative_clause'   // 関係詞
  | 'conjunction'       // 接続詞
  | 'preposition'       // 前置詞
  | 'subjunctive'       // 仮定法
  | 'passive'           // 受動態
  | 'comparison'        // 比較
  | 'article'           // 冠詞
  | 'pronoun'           // 代名詞

export interface GrammarQuestion {
  id: string
  question_text: string
  options: string[] // ["A) ...", "B) ...", "C) ...", "D) ..."]
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  category: GrammarCategory
  subcategory: string | null
  difficulty: number // 1-5
  grammar_point: string | null
  is_ai_generated: boolean
  ai_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface GrammarAnswer {
  id: string
  user_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  time_spent_seconds: number | null
  answered_at: string
}

export interface GrammarQuestionWithAnswer extends GrammarQuestion {
  user_answer: GrammarAnswer | null
}
```

### 2.3 src/types/review.ts

```typescript
export type ReviewItemType = 'vocabulary' | 'grammar' | 'reading'

export interface Bookmark {
  id: string
  user_id: string
  item_type: ReviewItemType
  item_id: string
  note: string | null
  created_at: string
}

export interface ReviewScheduleItem {
  id: string
  user_id: string
  item_type: ReviewItemType
  item_id: string
  scheduled_date: string
  priority: 1 | 2 | 3
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

// 間隔反復学習の設定
export interface SpacedRepetitionConfig {
  // 正解時の間隔乗数
  correctMultiplier: number // default: 2.5
  // 不正解時の間隔
  incorrectInterval: number // default: 1 (day)
  // 最大間隔（日）
  maxInterval: number // default: 180
  // 最小間隔（日）
  minInterval: number // default: 1
}
```

---

## 3. Server Actions

### 3.1 src/actions/vocabulary.ts

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// 単語一覧取得（レベル/カテゴリでフィルタ可能）
export async function getVocabulary(options?: {
  level?: number
  category?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from("vocabulary")
    .select("*, vocabulary_progress!left(*)") // 進捗も一緒に取得

  if (options?.level) {
    query = query.eq("level", options.level)
  }
  if (options?.category) {
    query = query.eq("category", options.category)
  }

  query = query
    .order("level", { ascending: true })
    .order("word", { ascending: true })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// 今日の復習単語を取得
export async function getTodayReviewVocabulary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("vocabulary_progress")
    .select("*, vocabulary(*)")
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(20)

  if (error) throw error
  return data
}

// 単語学習結果を記録
export async function recordVocabularyResult(
  vocabularyId: string,
  isCorrect: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // 既存の進捗を取得
  const { data: existing } = await supabase
    .from("vocabulary_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabularyId)
    .single()

  const now = new Date()
  let newFamiliarity: number
  let newInterval: number

  if (existing) {
    // 既存の進捗を更新
    if (isCorrect) {
      newFamiliarity = Math.min(existing.familiarity + 1, 5)
      newInterval = Math.min(existing.review_interval_days * 2.5, 180)
    } else {
      newFamiliarity = Math.max(existing.familiarity - 1, 0)
      newInterval = 1
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + Math.round(newInterval))

    const { error } = await supabase
      .from("vocabulary_progress")
      .update({
        familiarity: newFamiliarity,
        correct_count: existing.correct_count + (isCorrect ? 1 : 0),
        incorrect_count: existing.incorrect_count + (isCorrect ? 0 : 1),
        last_reviewed_at: now.toISOString(),
        next_review_at: nextReview.toISOString(),
        review_interval_days: Math.round(newInterval),
        updated_at: now.toISOString()
      })
      .eq("id", existing.id)

    if (error) throw error
  } else {
    // 新規作成
    newFamiliarity = isCorrect ? 1 : 0
    newInterval = isCorrect ? 3 : 1

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + newInterval)

    const { error } = await supabase
      .from("vocabulary_progress")
      .insert({
        user_id: user.id,
        vocabulary_id: vocabularyId,
        familiarity: newFamiliarity,
        correct_count: isCorrect ? 1 : 0,
        incorrect_count: isCorrect ? 0 : 1,
        last_reviewed_at: now.toISOString(),
        next_review_at: nextReview.toISOString(),
        review_interval_days: newInterval
      })

    if (error) throw error
  }

  revalidatePath("/vocabulary")
}

// 単語統計を取得
export async function getVocabularyStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: progress } = await supabase
    .from("vocabulary_progress")
    .select("familiarity, correct_count, incorrect_count")
    .eq("user_id", user.id)

  const { count: totalWords } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })

  if (!progress) return null

  const learned = progress.filter(p => p.familiarity >= 1).length
  const mastered = progress.filter(p => p.familiarity >= 4).length
  const totalCorrect = progress.reduce((sum, p) => sum + p.correct_count, 0)
  const totalIncorrect = progress.reduce((sum, p) => sum + p.incorrect_count, 0)
  const totalAttempts = totalCorrect + totalIncorrect

  return {
    totalWords: totalWords || 0,
    learned,
    mastered,
    accuracy: totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0,
    reviewDue: progress.filter(p =>
      p.next_review_at && new Date(p.next_review_at) <= new Date()
    ).length
  }
}
```

### 3.2 src/actions/grammar.ts

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// 文法問題一覧取得
export async function getGrammarQuestions(options?: {
  category?: string
  difficulty?: number
  limit?: number
  offset?: number
  excludeAnswered?: boolean // 回答済みを除外
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from("grammar_questions")
    .select("*")

  if (options?.category) {
    query = query.eq("category", options.category)
  }
  if (options?.difficulty) {
    query = query.eq("difficulty", options.difficulty)
  }

  query = query.order("created_at", { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ランダムな文法問題を取得（練習モード用）
export async function getRandomGrammarQuestions(count: number = 10, options?: {
  category?: string
  difficulty?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from("grammar_questions")
    .select("*")

  if (options?.category) {
    query = query.eq("category", options.category)
  }
  if (options?.difficulty) {
    query = query.eq("difficulty", options.difficulty)
  }

  // ランダム取得（Supabaseの場合はSQL関数を使うか、クライアント側でシャッフル）
  const { data, error } = await query

  if (error) throw error

  // シャッフルして指定数を返す
  const shuffled = data?.sort(() => Math.random() - 0.5) || []
  return shuffled.slice(0, count)
}

// 文法問題の回答を送信
export async function submitGrammarAnswer(
  questionId: string,
  selectedAnswer: string,
  timeSpentSeconds?: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // 正解を取得
  const { data: question } = await supabase
    .from("grammar_questions")
    .select("correct_answer")
    .eq("id", questionId)
    .single()

  if (!question) throw new Error("Question not found")

  const isCorrect = question.correct_answer === selectedAnswer

  const { data, error } = await supabase
    .from("grammar_answers")
    .insert({
      user_id: user.id,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/grammar")

  return { isCorrect, correctAnswer: question.correct_answer }
}

// 文法カテゴリ別の統計を取得
export async function getGrammarStatsByCategory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("grammar_stats_by_category")
    .select("*")
    .eq("user_id", user.id)

  if (error) throw error
  return data
}

// 間違えた文法問題を取得
export async function getIncorrectGrammarQuestions(limit: number = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // 最近間違えた問題を取得
  const { data, error } = await supabase
    .from("grammar_answers")
    .select(`
      *,
      grammar_questions(*)
    `)
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .order("answered_at", { ascending: false })
    .limit(limit)

  if (error) throw error

  // 重複を除去して問題を返す
  const uniqueQuestions = new Map()
  data?.forEach(item => {
    if (!uniqueQuestions.has(item.question_id)) {
      uniqueQuestions.set(item.question_id, item.grammar_questions)
    }
  })

  return Array.from(uniqueQuestions.values())
}
```

### 3.3 src/actions/review.ts

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ReviewItemType } from "@/types/review"

// ブックマーク追加
export async function addBookmark(
  itemType: ReviewItemType,
  itemId: string,
  note?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("bookmarks")
    .upsert({
      user_id: user.id,
      item_type: itemType,
      item_id: itemId,
      note: note || null
    }, {
      onConflict: "user_id,item_type,item_id"
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/review")
  return data
}

// ブックマーク削除
export async function removeBookmark(
  itemType: ReviewItemType,
  itemId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)

  if (error) throw error

  revalidatePath("/review")
}

// ブックマーク一覧取得
export async function getBookmarks(itemType?: ReviewItemType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (itemType) {
    query = query.eq("item_type", itemType)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// 今日の復習スケジュールを取得
export async function getTodayReviewSchedule() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from("review_schedule")
    .select("*")
    .eq("user_id", user.id)
    .lte("scheduled_date", today)
    .eq("is_completed", false)
    .order("priority", { ascending: false })
    .order("scheduled_date", { ascending: true })

  if (error) throw error
  return data
}

// 復習アイテムを完了としてマーク
export async function completeReviewItem(scheduleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("review_schedule")
    .update({
      is_completed: true,
      completed_at: new Date().toISOString()
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/review")
}

// 間違えた問題から復習スケジュールを自動生成
export async function generateReviewScheduleFromMistakes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // 過去7日間の間違えた問題を取得（長文）
  const { data: readingMistakes } = await supabase
    .from("user_answers")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .gte("answered_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // 過去7日間の間違えた問題を取得（文法）
  const { data: grammarMistakes } = await supabase
    .from("grammar_answers")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .gte("answered_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const scheduleItems = []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const scheduledDate = tomorrow.toISOString().split('T')[0]

  // 長文問題のスケジュール作成
  readingMistakes?.forEach(item => {
    scheduleItems.push({
      user_id: user.id,
      item_type: 'reading' as const,
      item_id: item.question_id,
      scheduled_date: scheduledDate,
      priority: 2
    })
  })

  // 文法問題のスケジュール作成
  grammarMistakes?.forEach(item => {
    scheduleItems.push({
      user_id: user.id,
      item_type: 'grammar' as const,
      item_id: item.question_id,
      scheduled_date: scheduledDate,
      priority: 2
    })
  })

  if (scheduleItems.length > 0) {
    const { error } = await supabase
      .from("review_schedule")
      .upsert(scheduleItems, {
        onConflict: "user_id,item_type,item_id,scheduled_date"
      })

    if (error) throw error
  }

  revalidatePath("/review")
  return scheduleItems.length
}
```

### 3.4 src/actions/timer.ts

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

// 推奨時間の定義（秒）
export const RECOMMENDED_TIME = {
  reading: {
    single_passage: 180, // 3分
    double_passage: 300, // 5分
    triple_passage: 420, // 7分
  },
  grammar: {
    easy: 30,      // 30秒
    medium: 45,    // 45秒
    hard: 60,      // 1分
  },
  vocabulary: {
    flashcard: 10, // 10秒
    test: 15,      // 15秒
  }
}

// 時間統計を取得
export async function getTimeStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 長文読解の時間統計
  const { data: readingStats } = await supabase
    .from("user_answers")
    .select("time_spent_seconds")
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  // 文法問題の時間統計
  const { data: grammarStats } = await supabase
    .from("grammar_answers")
    .select("time_spent_seconds")
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  const readingTimes = readingStats?.map(s => s.time_spent_seconds) || []
  const grammarTimes = grammarStats?.map(s => s.time_spent_seconds) || []

  return {
    reading: {
      total: readingTimes.reduce((a, b) => a + (b || 0), 0),
      average: readingTimes.length > 0
        ? Math.round(readingTimes.reduce((a, b) => a + (b || 0), 0) / readingTimes.length)
        : 0,
      count: readingTimes.length
    },
    grammar: {
      total: grammarTimes.reduce((a, b) => a + (b || 0), 0),
      average: grammarTimes.length > 0
        ? Math.round(grammarTimes.reduce((a, b) => a + (b || 0), 0) / grammarTimes.length)
        : 0,
      count: grammarTimes.length
    }
  }
}

// 時間超過率を取得
export async function getTimeOverruns() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 文法問題の時間超過を計算
  const { data: grammarAnswers } = await supabase
    .from("grammar_answers")
    .select(`
      time_spent_seconds,
      grammar_questions(difficulty)
    `)
    .eq("user_id", user.id)
    .not("time_spent_seconds", "is", null)

  let overruns = 0
  let total = 0

  grammarAnswers?.forEach(answer => {
    const difficulty = answer.grammar_questions?.difficulty || 3
    const recommended = difficulty <= 2
      ? RECOMMENDED_TIME.grammar.easy
      : difficulty <= 4
        ? RECOMMENDED_TIME.grammar.medium
        : RECOMMENDED_TIME.grammar.hard

    if (answer.time_spent_seconds && answer.time_spent_seconds > recommended) {
      overruns++
    }
    total++
  })

  return {
    overrunCount: overruns,
    totalCount: total,
    overrunRate: total > 0 ? Math.round((overruns / total) * 100) : 0
  }
}
```

---

## 4. コンポーネント設計

### 4.1 単語学習コンポーネント

#### src/components/vocabulary/FlashCard.tsx
```typescript
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw, Check, X } from "lucide-react"
import { Vocabulary } from "@/types/vocabulary"

interface FlashCardProps {
  vocabulary: Vocabulary
  direction: "en-to-ja" | "ja-to-en"
  onResult: (isCorrect: boolean) => void
}

export function FlashCard({ vocabulary, direction, onResult }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const front = direction === "en-to-ja" ? vocabulary.word : vocabulary.meaning
  const back = direction === "en-to-ja" ? vocabulary.meaning : vocabulary.word

  return (
    <div className="perspective-1000">
      <Card
        className={`
          w-full h-64 cursor-pointer transition-transform duration-500
          ${isFlipped ? "rotate-y-180" : ""}
        `}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {!isFlipped ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <p className="text-3xl font-bold">{front}</p>
            {direction === "en-to-ja" && vocabulary.pronunciation && (
              <p className="text-gray-500 mt-2">{vocabulary.pronunciation}</p>
            )}
            <p className="text-sm text-gray-400 mt-4">タップして答えを確認</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <p className="text-2xl font-bold">{back}</p>
            {vocabulary.example_sentence && (
              <div className="mt-4 text-sm text-gray-600">
                <p className="italic">{vocabulary.example_sentence}</p>
                {vocabulary.example_translation && (
                  <p className="text-gray-500">{vocabulary.example_translation}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {isFlipped && (
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="lg"
            className="text-red-500 border-red-500"
            onClick={() => onResult(false)}
          >
            <X className="mr-2 h-5 w-5" />
            わからなかった
          </Button>
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600"
            onClick={() => onResult(true)}
          >
            <Check className="mr-2 h-5 w-5" />
            覚えた
          </Button>
        </div>
      )}
    </div>
  )
}
```

#### src/components/vocabulary/VocabularyList.tsx
```typescript
"use client"

import { useState } from "react"
import { VocabularyWithProgress } from "@/types/vocabulary"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface VocabularyListProps {
  vocabularies: VocabularyWithProgress[]
  onSelect: (vocab: VocabularyWithProgress) => void
}

const levelLabels = {
  1: "600点",
  2: "700点",
  3: "800点",
  4: "900点"
}

export function VocabularyList({ vocabularies, onSelect }: VocabularyListProps) {
  return (
    <div className="space-y-2">
      {vocabularies.map((vocab) => (
        <div
          key={vocab.id}
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onSelect(vocab)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{vocab.word}</p>
              <p className="text-sm text-gray-600">{vocab.meaning}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{levelLabels[vocab.level]}</Badge>
              {vocab.progress && (
                <div className="w-20">
                  <Progress value={(vocab.progress.familiarity / 5) * 100} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 4.2 文法学習コンポーネント

#### src/components/grammar/GrammarQuestion.tsx
```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GrammarQuestion as GrammarQuestionType } from "@/types/grammar"
import { Timer } from "@/components/common/Timer"

interface GrammarQuestionProps {
  question: GrammarQuestionType
  onSubmit: (answer: string, timeSpent: number) => Promise<{
    isCorrect: boolean
    correctAnswer: string
  }>
  showTimer?: boolean
  recommendedTime?: number
}

const categoryLabels: Record<string, string> = {
  parts_of_speech: "品詞",
  tense: "時制",
  relative_clause: "関係詞",
  conjunction: "接続詞",
  preposition: "前置詞",
  subjunctive: "仮定法",
  passive: "受動態",
  comparison: "比較",
  article: "冠詞",
  pronoun: "代名詞"
}

export function GrammarQuestion({
  question,
  onSubmit,
  showTimer = true,
  recommendedTime = 45
}: GrammarQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedAnswer || isSubmitting) return

    setIsSubmitting(true)
    const response = await onSubmit(selectedAnswer, timeSpent)
    setResult(response)
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{categoryLabels[question.category]}</Badge>
          {showTimer && !result && (
            <Timer
              onTimeUpdate={setTimeSpent}
              recommendedTime={recommendedTime}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg">{question.question_text}</p>

        <RadioGroup
          value={selectedAnswer}
          onValueChange={setSelectedAnswer}
          disabled={!!result}
        >
          {question.options.map((option, index) => {
            const letter = option.charAt(0)
            const isCorrect = result && letter === result.correctAnswer
            const isSelected = letter === selectedAnswer
            const isWrong = result && isSelected && !result.isCorrect

            return (
              <div
                key={index}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg border
                  ${isCorrect ? "bg-green-50 border-green-500" : ""}
                  ${isWrong ? "bg-red-50 border-red-500" : ""}
                `}
              >
                <RadioGroupItem value={letter} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        {!result ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full"
          >
            回答する
          </Button>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${result.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-bold ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {result.isCorrect ? "正解！" : "不正解"}
              </p>
              <p className="text-sm text-gray-700 mt-2">{question.explanation}</p>
              {question.grammar_point && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-sm font-semibold">文法ポイント</p>
                  <p className="text-sm">{question.grammar_point}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 4.3 共通コンポーネント

#### src/components/common/Timer.tsx
```typescript
"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface TimerProps {
  onTimeUpdate: (seconds: number) => void
  recommendedTime?: number
  autoStart?: boolean
}

export function Timer({ onTimeUpdate, recommendedTime, autoStart = true }: TimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1
          onTimeUpdate(newValue)
          return newValue
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onTimeUpdate])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isOvertime = recommendedTime && seconds > recommendedTime

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1 rounded-full text-sm
      ${isOvertime ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}
    `}>
      {isOvertime ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span className="font-mono">{formatTime(seconds)}</span>
      {recommendedTime && (
        <span className="text-xs opacity-70">
          / {formatTime(recommendedTime)}
        </span>
      )}
    </div>
  )
}
```

#### src/components/common/BookmarkButton.tsx
```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { addBookmark, removeBookmark } from "@/actions/review"
import { ReviewItemType } from "@/types/review"

interface BookmarkButtonProps {
  itemType: ReviewItemType
  itemId: string
  isBookmarked: boolean
}

export function BookmarkButton({ itemType, itemId, isBookmarked: initialBookmarked }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isBookmarked) {
        await removeBookmark(itemType, itemId)
      } else {
        await addBookmark(itemType, itemId)
      }
      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error("Bookmark toggle failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={isBookmarked ? "text-yellow-500" : "text-gray-400"}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-5 w-5" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  )
}
```

---

## 5. ページ設計

### 5.1 単語学習ページ

#### src/app/(main)/vocabulary/page.tsx
```typescript
import { Suspense } from "react"
import { getVocabulary, getVocabularyStats, getTodayReviewVocabulary } from "@/actions/vocabulary"
import { VocabularyDashboard } from "@/components/vocabulary/VocabularyDashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default async function VocabularyPage() {
  const [vocabularies, stats, todayReview] = await Promise.all([
    getVocabulary({ limit: 50 }),
    getVocabularyStats(),
    getTodayReviewVocabulary()
  ])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">単語学習</h1>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <VocabularyDashboard
          vocabularies={vocabularies}
          stats={stats}
          todayReview={todayReview}
        />
      </Suspense>
    </div>
  )
}
```

#### src/app/(main)/vocabulary/flashcard/page.tsx
```typescript
import { getVocabulary } from "@/actions/vocabulary"
import { FlashCardSession } from "@/components/vocabulary/FlashCardSession"

interface Props {
  searchParams: { level?: string; category?: string }
}

export default async function FlashCardPage({ searchParams }: Props) {
  const vocabularies = await getVocabulary({
    level: searchParams.level ? parseInt(searchParams.level) : undefined,
    category: searchParams.category,
    limit: 20
  })

  return (
    <div className="container mx-auto py-6">
      <FlashCardSession vocabularies={vocabularies} />
    </div>
  )
}
```

### 5.2 文法学習ページ

#### src/app/(main)/grammar/page.tsx
```typescript
import { Suspense } from "react"
import { getGrammarStatsByCategory } from "@/actions/grammar"
import { GrammarDashboard } from "@/components/grammar/GrammarDashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default async function GrammarPage() {
  const categoryStats = await getGrammarStatsByCategory()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">文法学習</h1>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <GrammarDashboard categoryStats={categoryStats} />
      </Suspense>
    </div>
  )
}
```

#### src/app/(main)/grammar/practice/page.tsx
```typescript
import { getRandomGrammarQuestions } from "@/actions/grammar"
import { GrammarPracticeSession } from "@/components/grammar/GrammarPracticeSession"

interface Props {
  searchParams: { category?: string; count?: string }
}

export default async function GrammarPracticePage({ searchParams }: Props) {
  const questions = await getRandomGrammarQuestions(
    searchParams.count ? parseInt(searchParams.count) : 10,
    { category: searchParams.category }
  )

  return (
    <div className="container mx-auto py-6">
      <GrammarPracticeSession questions={questions} />
    </div>
  )
}
```

### 5.3 復習ページ

#### src/app/(main)/review/page.tsx
```typescript
import { Suspense } from "react"
import {
  getBookmarks,
  getTodayReviewSchedule,
  generateReviewScheduleFromMistakes
} from "@/actions/review"
import { getIncorrectGrammarQuestions } from "@/actions/grammar"
import { ReviewDashboard } from "@/components/review/ReviewDashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default async function ReviewPage() {
  const [bookmarks, todaySchedule, incorrectGrammar] = await Promise.all([
    getBookmarks(),
    getTodayReviewSchedule(),
    getIncorrectGrammarQuestions(10)
  ])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">復習</h1>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <ReviewDashboard
          bookmarks={bookmarks}
          todaySchedule={todaySchedule}
          incorrectGrammar={incorrectGrammar}
        />
      </Suspense>
    </div>
  )
}
```

---

## 6. 管理者機能拡張

### 6.1 単語管理 (AI生成)

#### src/actions/ai/generate-vocabulary.ts
```typescript
"use server"

import { createOpenAIClient, handleOpenAIError } from "@/lib/openai/client"
import { requireAdmin } from "./admin"
import { createClient } from "@/lib/supabase/server"
import { VocabularyLevel, VocabularyCategory } from "@/types/vocabulary"

interface VocabularyGenerationRequest {
  level: VocabularyLevel
  category: VocabularyCategory
  count: number
}

interface GeneratedVocabulary {
  word: string
  meaning: string
  pronunciation: string
  part_of_speech: string
  example_sentence: string
  example_translation: string
  synonyms: string[]
}

export async function generateVocabulary(request: VocabularyGenerationRequest) {
  await requireAdmin()

  const openai = createOpenAIClient()

  const levelDescriptions = {
    1: "TOEIC 600点レベル（基礎的なビジネス英語）",
    2: "TOEIC 700点レベル（中級ビジネス英語）",
    3: "TOEIC 800点レベル（上級ビジネス英語）",
    4: "TOEIC 900点レベル（高度なビジネス英語）"
  }

  const prompt = `
Generate ${request.count} TOEIC vocabulary words for the following criteria:
- Level: ${levelDescriptions[request.level]}
- Category: ${request.category}

Return a JSON array with the following structure:
[
  {
    "word": "negotiate",
    "meaning": "交渉する",
    "pronunciation": "/nɪˈɡoʊʃieɪt/",
    "part_of_speech": "verb",
    "example_sentence": "The sales team will negotiate the contract terms with the client.",
    "example_translation": "営業チームはクライアントと契約条件を交渉します。",
    "synonyms": ["bargain", "discuss", "deal"]
  }
]

Requirements:
- Words should be commonly used in TOEIC Part 7 reading passages
- Examples should be in business context
- Provide accurate Japanese translations
- Include 2-3 synonyms for each word
`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert TOEIC vocabulary teacher." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error("No content in response")

    const parsed = JSON.parse(content)
    const vocabularies = Array.isArray(parsed) ? parsed : parsed.vocabularies || []

    return {
      vocabularies: vocabularies as GeneratedVocabulary[],
      metadata: {
        model: response.model,
        generatedAt: new Date().toISOString(),
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens
      }
    }
  } catch (error) {
    throw handleOpenAIError(error)
  }
}

export async function saveGeneratedVocabulary(
  vocabularies: GeneratedVocabulary[],
  level: VocabularyLevel,
  category: VocabularyCategory,
  metadata: Record<string, unknown>
) {
  await requireAdmin()

  const supabase = await createClient()

  const records = vocabularies.map(vocab => ({
    word: vocab.word,
    meaning: vocab.meaning,
    pronunciation: vocab.pronunciation,
    part_of_speech: vocab.part_of_speech,
    level,
    example_sentence: vocab.example_sentence,
    example_translation: vocab.example_translation,
    category,
    synonyms: vocab.synonyms,
    is_ai_generated: true,
    ai_metadata: metadata
  }))

  const { data, error } = await supabase
    .from("vocabulary")
    .insert(records)
    .select()

  if (error) throw error
  return data
}
```

### 6.2 文法問題管理 (AI生成)

#### src/actions/ai/generate-grammar.ts
```typescript
"use server"

import { createOpenAIClient, handleOpenAIError } from "@/lib/openai/client"
import { requireAdmin } from "./admin"
import { createClient } from "@/lib/supabase/server"
import { GrammarCategory } from "@/types/grammar"

interface GrammarGenerationRequest {
  category: GrammarCategory
  difficulty: number
  count: number
}

interface GeneratedGrammarQuestion {
  question_text: string
  options: string[]
  correct_answer: "A" | "B" | "C" | "D"
  explanation: string
  grammar_point: string
}

const categoryDescriptions: Record<GrammarCategory, string> = {
  parts_of_speech: "品詞問題（名詞、動詞、形容詞、副詞の使い分け）",
  tense: "時制問題（現在、過去、未来、完了形）",
  relative_clause: "関係詞問題（which, who, that, whose等）",
  conjunction: "接続詞問題（and, but, because, although等）",
  preposition: "前置詞問題（at, in, on, for, to等）",
  subjunctive: "仮定法問題（if, wish, as if等）",
  passive: "受動態問題",
  comparison: "比較問題（比較級、最上級、as...as）",
  article: "冠詞問題（a, an, the）",
  pronoun: "代名詞問題"
}

export async function generateGrammarQuestions(request: GrammarGenerationRequest) {
  await requireAdmin()

  const openai = createOpenAIClient()

  const prompt = `
Generate ${request.count} TOEIC Part 5/6 style grammar questions for:
- Category: ${categoryDescriptions[request.category]}
- Difficulty: ${request.difficulty}/5

Return a JSON object with this structure:
{
  "questions": [
    {
      "question_text": "The manager ------- the meeting due to the unexpected circumstances.",
      "options": ["A) postpone", "B) postponed", "C) postponing", "D) has postpone"],
      "correct_answer": "B",
      "explanation": "過去の出来事を表すため、過去形「postponed」が正解です。文中の「unexpected circumstances」は過去に起きた状況を示しています。",
      "grammar_point": "時制の一致：過去の出来事には過去形を使用します。動詞の時制は文脈から判断することが重要です。"
    }
  ]
}

Requirements:
- Questions should match TOEIC Part 5 format
- Use business/workplace contexts
- Provide detailed Japanese explanations
- Include a grammar point summary for each question
- Options should be plausible and test the specific grammar point
`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert TOEIC grammar question writer." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error("No content in response")

    const parsed = JSON.parse(content)

    return {
      questions: parsed.questions as GeneratedGrammarQuestion[],
      metadata: {
        model: response.model,
        generatedAt: new Date().toISOString(),
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens
      }
    }
  } catch (error) {
    throw handleOpenAIError(error)
  }
}

export async function saveGeneratedGrammarQuestions(
  questions: GeneratedGrammarQuestion[],
  category: GrammarCategory,
  difficulty: number,
  metadata: Record<string, unknown>
) {
  await requireAdmin()

  const supabase = await createClient()

  const records = questions.map(q => ({
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    category,
    difficulty,
    grammar_point: q.grammar_point,
    is_ai_generated: true,
    ai_metadata: metadata
  }))

  const { data, error } = await supabase
    .from("grammar_questions")
    .insert(records)
    .select()

  if (error) throw error
  return data
}
```

---

## 7. ナビゲーション更新

### 7.1 src/components/layout/Sidebar.tsx 更新

```typescript
// 既存のナビゲーションに追加
const navigationItems = [
  { name: "ダッシュボード", href: "/dashboard", icon: Home },
  { name: "長文読解", href: "/reading", icon: BookOpen },
  { name: "単語学習", href: "/vocabulary", icon: Languages },  // 追加
  { name: "文法学習", href: "/grammar", icon: GraduationCap }, // 追加
  { name: "復習", href: "/review", icon: RotateCcw },          // 追加
  { name: "学習分析", href: "/analytics", icon: BarChart },
]
```

### 7.2 middleware.ts 更新

```typescript
const protectedPaths = [
  '/dashboard',
  '/reading',
  '/vocabulary',  // 追加
  '/grammar',     // 追加
  '/review',      // 追加
  '/results',
  '/admin',
  '/analytics'
]
```

---

## 8. シードデータ

### 8.1 supabase/seeds/vocabulary.sql

```sql
-- 600点レベルの基礎単語
INSERT INTO vocabulary (word, meaning, pronunciation, part_of_speech, level, example_sentence, example_translation, category, synonyms) VALUES
('schedule', '予定、スケジュール', '/ˈskedʒuːl/', 'noun', 1, 'Please check the meeting schedule.', '会議の予定を確認してください。', 'business', ARRAY['timetable', 'agenda', 'plan']),
('confirm', '確認する', '/kənˈfɜːrm/', 'verb', 1, 'I would like to confirm your reservation.', 'ご予約を確認させていただきます。', 'business', ARRAY['verify', 'validate', 'affirm']),
('deadline', '締め切り', '/ˈdedlaɪn/', 'noun', 1, 'The project deadline is next Friday.', 'プロジェクトの締め切りは来週の金曜日です。', 'business', ARRAY['due date', 'time limit']),
-- ... 続く
```

### 8.2 supabase/seeds/grammar.sql

```sql
-- 品詞問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
(
  'The new policy will ------- take effect next month.',
  ARRAY['A) official', 'B) officially', 'C) officialize', 'D) office'],
  'B',
  '動詞「take」を修飾するため、副詞「officially」が正解です。副詞は動詞、形容詞、他の副詞を修飾します。',
  'parts_of_speech',
  2,
  '副詞の位置：副詞は通常、修飾する動詞の前に置かれます。'
),
-- ... 続く
```

---

## 9. 実装順序

### Step 1: データベース設計 (migration 006)
1. 新規テーブル作成（vocabulary, vocabulary_progress, grammar_questions, grammar_answers, bookmarks, review_schedule）
2. RLSポリシー設定
3. 分析用ビュー作成
4. インデックス作成

### Step 2: 型定義
1. `src/types/vocabulary.ts` 作成
2. `src/types/grammar.ts` 作成
3. `src/types/review.ts` 作成
4. `src/types/database.ts` 更新

### Step 3: Server Actions
1. `src/actions/vocabulary.ts` 作成
2. `src/actions/grammar.ts` 作成
3. `src/actions/review.ts` 作成
4. `src/actions/timer.ts` 作成

### Step 4: 共通コンポーネント
1. `Timer` コンポーネント作成
2. `BookmarkButton` コンポーネント作成

### Step 5: 単語学習機能
1. `FlashCard` コンポーネント作成
2. `VocabularyList` コンポーネント作成
3. `FlashCardSession` コンポーネント作成
4. `/vocabulary` ページ作成
5. `/vocabulary/flashcard` ページ作成

### Step 6: 文法学習機能
1. `GrammarQuestion` コンポーネント作成
2. `GrammarPracticeSession` コンポーネント作成
3. `GrammarDashboard` コンポーネント作成
4. `/grammar` ページ作成
5. `/grammar/practice` ページ作成

### Step 7: 復習機能
1. `ReviewDashboard` コンポーネント作成
2. `BookmarksList` コンポーネント作成
3. `ReviewScheduleList` コンポーネント作成
4. `/review` ページ作成

### Step 8: 管理者機能拡張
1. `generate-vocabulary.ts` 作成
2. `generate-grammar.ts` 作成
3. 管理画面に単語/文法生成UI追加

### Step 9: ナビゲーション・統合
1. Sidebar更新
2. middleware更新
3. ダッシュボード統計更新

### Step 10: シードデータ・テスト
1. 初期単語データ投入
2. 初期文法問題投入
3. E2Eテスト作成

---

## 10. 見積もり

| 機能 | 複雑度 |
|------|--------|
| データベース設計 | 中 |
| 単語学習機能 | 中 |
| 文法学習機能 | 中 |
| 復習機能 | 中 |
| 時間制限機能 | 低 |
| 間隔反復学習 | 高 |
| AI生成機能拡張 | 中 |
| テスト | 中 |

---

## 11. 注意事項

1. **パフォーマンス**: 単語一覧は仮想スクロールの検討が必要
2. **オフライン対応**: Phase 5でPWA対応時にローカルキャッシュを検討
3. **間隔反復アルゴリズム**: SM-2アルゴリズムをベースに調整
4. **セキュリティ**: RLSで適切なアクセス制御を実装
5. **UX**: フラッシュカードのアニメーションはCSS transformで実装
