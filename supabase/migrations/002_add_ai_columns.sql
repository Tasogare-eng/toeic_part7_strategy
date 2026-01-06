-- AI生成フラグとメタデータを追加
-- reading_passagesテーブル
ALTER TABLE public.reading_passages
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- reading_questionsテーブル
ALTER TABLE public.reading_questions
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN public.reading_passages.is_ai_generated IS 'AIによって生成された問題かどうか';
COMMENT ON COLUMN public.reading_passages.ai_metadata IS 'AI生成時のメタデータ（モデル、トークン数など）';
COMMENT ON COLUMN public.reading_questions.is_ai_generated IS 'AIによって生成された設問かどうか';
