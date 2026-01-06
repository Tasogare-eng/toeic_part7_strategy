-- 管理者フラグを追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN public.profiles.is_admin IS '管理者権限を持つユーザーかどうか';

-- インデックス追加（管理者の検索を高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;
