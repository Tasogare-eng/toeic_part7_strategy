-- =====================================================
-- 008: 模試機能テーブル
-- =====================================================

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
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('grammar', 'reading')),
  question_id UUID NOT NULL,
  passage_id UUID,
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
  selected_answer VARCHAR(1),
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
  estimated_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_exam_results_user ON mock_exam_results(user_id);
CREATE INDEX idx_mock_exam_results_created ON mock_exam_results(user_id, created_at DESC);

-- =====================================================
-- RLSポリシー
-- =====================================================

-- mock_exams
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exams" ON mock_exams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock exams" ON mock_exams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock exams" ON mock_exams
  FOR UPDATE USING (auth.uid() = user_id);

-- mock_exam_questions
ALTER TABLE mock_exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exam questions" ON mock_exam_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own mock exam questions" ON mock_exam_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
  );

-- mock_exam_answers
ALTER TABLE mock_exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exam answers" ON mock_exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mock_exams me
      JOIN mock_exam_questions meq ON meq.mock_exam_id = me.id
      WHERE meq.id = mock_question_id AND me.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own mock exam answers" ON mock_exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mock_exams me
      JOIN mock_exam_questions meq ON meq.mock_exam_id = me.id
      WHERE meq.id = mock_question_id AND me.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own mock exam answers" ON mock_exam_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mock_exams me
      JOIN mock_exam_questions meq ON meq.mock_exam_id = me.id
      WHERE meq.id = mock_question_id AND me.user_id = auth.uid()
    )
  );

-- mock_exam_results
ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mock exam results" ON mock_exam_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock exam results" ON mock_exam_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
