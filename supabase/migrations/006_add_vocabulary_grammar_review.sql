-- Phase 4: 単語・文法・復習機能のテーブル作成

-- =====================================================
-- 1. 単語テーブル
-- =====================================================
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL,
  meaning TEXT NOT NULL,
  pronunciation VARCHAR(200),
  part_of_speech VARCHAR(50), -- noun, verb, adjective, adverb, preposition, conjunction
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4), -- 1:600点, 2:700点, 3:800点, 4:900点
  example_sentence TEXT,
  example_translation TEXT,
  category VARCHAR(100), -- business, finance, marketing, hr, technology, travel, general
  synonyms TEXT[],
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_level ON vocabulary(level);
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
CREATE INDEX idx_vocabulary_word ON vocabulary(word);

-- =====================================================
-- 2. 単語学習進捗テーブル
-- =====================================================
CREATE TABLE vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  familiarity INTEGER DEFAULT 0 CHECK (familiarity BETWEEN 0 AND 5), -- 0:未学習, 5:完全習得
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_interval_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

CREATE INDEX idx_vocab_progress_user ON vocabulary_progress(user_id);
CREATE INDEX idx_vocab_progress_next_review ON vocabulary_progress(user_id, next_review_at);

-- =====================================================
-- 3. 文法問題テーブル
-- =====================================================
CREATE TABLE grammar_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["A) option1", "B) option2", "C) option3", "D) option4"]
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- parts_of_speech, tense, relative_clause, conjunction, preposition, etc.
  subcategory VARCHAR(100),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  grammar_point TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_category ON grammar_questions(category);
CREATE INDEX idx_grammar_difficulty ON grammar_questions(difficulty);

-- =====================================================
-- 4. 文法問題回答履歴テーブル
-- =====================================================
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
CREATE INDEX idx_grammar_answers_date ON grammar_answers(user_id, answered_at);

-- =====================================================
-- 5. ブックマークテーブル
-- =====================================================
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('vocabulary', 'grammar', 'reading')),
  item_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_type ON bookmarks(user_id, item_type);

-- =====================================================
-- 6. 復習スケジュールテーブル
-- =====================================================
CREATE TABLE review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('vocabulary', 'grammar', 'reading')),
  item_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3), -- 1:低, 2:中, 3:高
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id, scheduled_date)
);

CREATE INDEX idx_review_schedule_user_date ON review_schedule(user_id, scheduled_date);
CREATE INDEX idx_review_schedule_pending ON review_schedule(user_id, is_completed, scheduled_date);

-- =====================================================
-- 7. RLSポリシー
-- =====================================================

-- vocabulary: 全ユーザー読み取り可、管理者のみ書き込み可
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vocabulary" ON vocabulary
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert vocabulary" ON vocabulary
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update vocabulary" ON vocabulary
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete vocabulary" ON vocabulary
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- vocabulary_progress: 自分のデータのみ
ALTER TABLE vocabulary_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vocabulary progress" ON vocabulary_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary progress" ON vocabulary_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary progress" ON vocabulary_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary progress" ON vocabulary_progress
  FOR DELETE USING (auth.uid() = user_id);

-- grammar_questions: 全ユーザー読み取り可、管理者のみ書き込み可
ALTER TABLE grammar_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read grammar questions" ON grammar_questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert grammar questions" ON grammar_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update grammar questions" ON grammar_questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete grammar questions" ON grammar_questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- grammar_answers: 自分のデータのみ
ALTER TABLE grammar_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own grammar answers" ON grammar_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grammar answers" ON grammar_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grammar answers" ON grammar_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grammar answers" ON grammar_answers
  FOR DELETE USING (auth.uid() = user_id);

-- bookmarks: 自分のデータのみ
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- review_schedule: 自分のデータのみ
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own review schedule" ON review_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review schedule" ON review_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review schedule" ON review_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own review schedule" ON review_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. 分析用ビュー
-- =====================================================

-- 単語学習の日別統計
CREATE VIEW daily_vocabulary_stats AS
SELECT
  vp.user_id,
  DATE(vp.last_reviewed_at) as review_date,
  COUNT(*) as words_reviewed,
  SUM(CASE WHEN vp.familiarity >= 4 THEN 1 ELSE 0 END) as words_mastered,
  ROUND(AVG(vp.familiarity)::numeric, 2) as avg_familiarity
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
  ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END)::numeric, 1) as accuracy,
  ROUND(AVG(time_spent_seconds)::numeric, 1) as avg_time_seconds
FROM grammar_answers
GROUP BY user_id, DATE(answered_at);

-- 文法カテゴリ別統計
CREATE VIEW grammar_stats_by_category AS
SELECT
  ga.user_id,
  gq.category,
  COUNT(*) as total_answers,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(AVG(CASE WHEN ga.is_correct THEN 100.0 ELSE 0 END)::numeric, 1) as accuracy
FROM grammar_answers ga
JOIN grammar_questions gq ON ga.question_id = gq.id
GROUP BY ga.user_id, gq.category;

-- 単語レベル別統計
CREATE VIEW vocabulary_stats_by_level AS
SELECT
  vp.user_id,
  v.level,
  COUNT(*) as total_words,
  SUM(CASE WHEN vp.familiarity >= 1 THEN 1 ELSE 0 END) as learned_count,
  SUM(CASE WHEN vp.familiarity >= 4 THEN 1 ELSE 0 END) as mastered_count,
  ROUND(AVG(vp.familiarity)::numeric, 2) as avg_familiarity
FROM vocabulary_progress vp
JOIN vocabulary v ON vp.vocabulary_id = v.id
GROUP BY vp.user_id, v.level;
