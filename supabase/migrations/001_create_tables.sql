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
