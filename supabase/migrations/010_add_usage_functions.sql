-- ============================================
-- 010_add_usage_functions.sql
-- 利用制限のアトミック操作用関数
-- ============================================

-- 利用回数をアトミックにインクリメントする関数
-- 競合状態を防ぎ、現在のカウント値を返す
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_user_id UUID,
  p_usage_date DATE,
  p_column_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  -- 対象カラムのバリデーション
  IF p_column_name NOT IN (
    'reading_count', 'grammar_count', 'vocabulary_count',
    'ai_passage_count', 'ai_grammar_count', 'ai_vocabulary_count'
  ) THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_name;
  END IF;

  -- レコードが存在しない場合は挿入
  INSERT INTO usage_limits (user_id, usage_date)
  VALUES (p_user_id, p_usage_date)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- アトミックにインクリメントして新しい値を取得
  EXECUTE format(
    'UPDATE usage_limits
     SET %I = %I + 1, updated_at = NOW()
     WHERE user_id = $1 AND usage_date = $2
     RETURNING %I',
    p_column_name, p_column_name, p_column_name
  ) INTO v_new_count USING p_user_id, p_usage_date;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 今日の利用状況を取得または作成する関数
CREATE OR REPLACE FUNCTION get_or_create_today_usage(
  p_user_id UUID
)
RETURNS usage_limits AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_result usage_limits;
BEGIN
  -- 既存レコードを取得または新規作成
  INSERT INTO usage_limits (user_id, usage_date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- レコードを取得して返す
  SELECT * INTO v_result
  FROM usage_limits
  WHERE user_id = p_user_id AND usage_date = v_today;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 月間AI利用回数を集計する関数
CREATE OR REPLACE FUNCTION get_monthly_ai_usage(
  p_user_id UUID,
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
  ai_passage_total INTEGER,
  ai_grammar_total INTEGER,
  ai_vocabulary_total INTEGER
) AS $$
DECLARE
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_month INTEGER := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ul.ai_passage_count), 0)::INTEGER AS ai_passage_total,
    COALESCE(SUM(ul.ai_grammar_count), 0)::INTEGER AS ai_grammar_total,
    COALESCE(SUM(ul.ai_vocabulary_count), 0)::INTEGER AS ai_vocabulary_total
  FROM usage_limits ul
  WHERE ul.user_id = p_user_id
    AND EXTRACT(YEAR FROM ul.usage_date) = v_year
    AND EXTRACT(MONTH FROM ul.usage_date) = v_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC関数のアクセス権限設定
GRANT EXECUTE ON FUNCTION increment_usage_count(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_today_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_ai_usage(UUID, INTEGER, INTEGER) TO authenticated;
