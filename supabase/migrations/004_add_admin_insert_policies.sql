-- 管理者用のINSERTポリシーを追加

-- reading_passages: 管理者のみ挿入可能
CREATE POLICY "Admins can insert passages"
  ON public.reading_passages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- reading_questions: 管理者のみ挿入可能
CREATE POLICY "Admins can insert questions"
  ON public.reading_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
