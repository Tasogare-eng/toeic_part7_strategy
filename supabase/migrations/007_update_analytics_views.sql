-- 分析ビューを更新して、長文読解と文法問題の両方を含める

-- 既存のビューを削除
DROP VIEW IF EXISTS daily_user_stats;
DROP VIEW IF EXISTS user_stats_by_document_type;
DROP VIEW IF EXISTS user_stats_by_question_type;
DROP VIEW IF EXISTS user_stats_by_difficulty;

-- 日別の統計ビュー（長文読解 + 文法問題）
CREATE OR REPLACE VIEW daily_user_stats AS
SELECT
  user_id,
  date,
  SUM(questions_answered) AS questions_answered,
  SUM(correct_count) AS correct_count,
  CASE
    WHEN SUM(questions_answered) > 0
    THEN ROUND(SUM(correct_count)::NUMERIC / SUM(questions_answered) * 100, 1)
    ELSE 0
  END AS accuracy,
  SUM(total_time_seconds) AS total_time_seconds
FROM (
  -- 長文読解の回答
  SELECT
    user_id,
    DATE(answered_at) AS date,
    COUNT(*) AS questions_answered,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
    COALESCE(SUM(time_spent_seconds), 0) AS total_time_seconds
  FROM public.user_answers
  GROUP BY user_id, DATE(answered_at)

  UNION ALL

  -- 文法問題の回答
  SELECT
    user_id,
    DATE(answered_at) AS date,
    COUNT(*) AS questions_answered,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
    COALESCE(SUM(time_spent_seconds), 0) AS total_time_seconds
  FROM public.grammar_answers
  GROUP BY user_id, DATE(answered_at)
) combined
GROUP BY user_id, date;

-- 文書タイプ別統計ビュー（長文読解のみ）
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

-- 設問タイプ別統計ビュー（長文読解 + 文法カテゴリ）
CREATE OR REPLACE VIEW user_stats_by_question_type AS
SELECT
  user_id,
  question_type,
  SUM(questions_answered) AS questions_answered,
  SUM(correct_count) AS correct_count,
  CASE
    WHEN SUM(questions_answered) > 0
    THEN ROUND(SUM(correct_count)::NUMERIC / SUM(questions_answered) * 100, 1)
    ELSE 0
  END AS accuracy
FROM (
  -- 長文読解の設問タイプ
  SELECT
    ua.user_id,
    rq.question_type,
    COUNT(*) AS questions_answered,
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count
  FROM public.user_answers ua
  JOIN public.reading_questions rq ON ua.question_id = rq.id
  GROUP BY ua.user_id, rq.question_type

  UNION ALL

  -- 文法問題のカテゴリ
  SELECT
    ga.user_id,
    gq.category AS question_type,
    COUNT(*) AS questions_answered,
    SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) AS correct_count
  FROM public.grammar_answers ga
  JOIN public.grammar_questions gq ON ga.question_id = gq.id
  GROUP BY ga.user_id, gq.category
) combined
GROUP BY user_id, question_type;

-- 難易度別統計ビュー（長文読解 + 文法問題）
CREATE OR REPLACE VIEW user_stats_by_difficulty AS
SELECT
  user_id,
  difficulty,
  SUM(questions_answered) AS questions_answered,
  SUM(correct_count) AS correct_count,
  CASE
    WHEN SUM(questions_answered) > 0
    THEN ROUND(SUM(correct_count)::NUMERIC / SUM(questions_answered) * 100, 1)
    ELSE 0
  END AS accuracy
FROM (
  -- 長文読解の難易度
  SELECT
    ua.user_id,
    rp.difficulty,
    COUNT(*) AS questions_answered,
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count
  FROM public.user_answers ua
  JOIN public.reading_passages rp ON ua.passage_id = rp.id
  GROUP BY ua.user_id, rp.difficulty

  UNION ALL

  -- 文法問題の難易度
  SELECT
    ga.user_id,
    gq.difficulty,
    COUNT(*) AS questions_answered,
    SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) AS correct_count
  FROM public.grammar_answers ga
  JOIN public.grammar_questions gq ON ga.question_id = gq.id
  GROUP BY ga.user_id, gq.difficulty
) combined
GROUP BY user_id, difficulty;

-- コメント追加
COMMENT ON VIEW daily_user_stats IS 'ユーザーの日別学習統計（長文読解+文法）';
COMMENT ON VIEW user_stats_by_document_type IS 'ユーザーの文書タイプ別統計（長文読解のみ）';
COMMENT ON VIEW user_stats_by_question_type IS 'ユーザーの設問/カテゴリタイプ別統計（長文読解+文法）';
COMMENT ON VIEW user_stats_by_difficulty IS 'ユーザーの難易度別統計（長文読解+文法）';
