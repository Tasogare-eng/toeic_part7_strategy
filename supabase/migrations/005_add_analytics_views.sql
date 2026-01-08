-- 日別の統計ビュー
CREATE OR REPLACE VIEW daily_user_stats AS
SELECT
  user_id,
  DATE(answered_at) AS date,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy,
  COALESCE(SUM(time_spent_seconds), 0) AS total_time_seconds
FROM public.user_answers
GROUP BY user_id, DATE(answered_at);

-- 文書タイプ別統計ビュー
CREATE OR REPLACE VIEW user_stats_by_document_type AS
SELECT
  ua.user_id,
  rp.document_type,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy
FROM public.user_answers ua
JOIN public.reading_passages rp ON ua.passage_id = rp.id
GROUP BY ua.user_id, rp.document_type;

-- 設問タイプ別統計ビュー
CREATE OR REPLACE VIEW user_stats_by_question_type AS
SELECT
  ua.user_id,
  rq.question_type,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy
FROM public.user_answers ua
JOIN public.reading_questions rq ON ua.question_id = rq.id
GROUP BY ua.user_id, rq.question_type;

-- 難易度別統計ビュー
CREATE OR REPLACE VIEW user_stats_by_difficulty AS
SELECT
  ua.user_id,
  rp.difficulty,
  COUNT(*) AS questions_answered,
  SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy
FROM public.user_answers ua
JOIN public.reading_passages rp ON ua.passage_id = rp.id
GROUP BY ua.user_id, rp.difficulty;

-- コメント追加
COMMENT ON VIEW daily_user_stats IS 'ユーザーの日別学習統計';
COMMENT ON VIEW user_stats_by_document_type IS 'ユーザーの文書タイプ別統計';
COMMENT ON VIEW user_stats_by_question_type IS 'ユーザーの設問タイプ別統計';
COMMENT ON VIEW user_stats_by_difficulty IS 'ユーザーの難易度別統計';
