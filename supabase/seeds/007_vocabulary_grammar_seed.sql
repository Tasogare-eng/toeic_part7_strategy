-- Phase 4: 単語・文法のシードデータ

-- =====================================================
-- 単語データ（600点レベル - ビジネス基礎）
-- =====================================================
INSERT INTO vocabulary (word, meaning, pronunciation, part_of_speech, level, example_sentence, example_translation, category, synonyms) VALUES
('schedule', '予定、スケジュール', '/ˈskedʒuːl/', 'noun', 1, 'Please check the meeting schedule before the conference.', '会議の前に打ち合わせの予定を確認してください。', 'business', ARRAY['timetable', 'agenda', 'plan']),
('confirm', '確認する', '/kənˈfɜːrm/', 'verb', 1, 'I would like to confirm your reservation for tomorrow.', '明日のご予約を確認させていただきます。', 'business', ARRAY['verify', 'validate', 'affirm']),
('deadline', '締め切り', '/ˈdedlaɪn/', 'noun', 1, 'The project deadline is next Friday.', 'プロジェクトの締め切りは来週の金曜日です。', 'business', ARRAY['due date', 'time limit', 'cutoff']),
('available', '利用可能な', '/əˈveɪləbl/', 'adjective', 1, 'The conference room is available from 2 PM.', '会議室は午後2時から利用可能です。', 'business', ARRAY['accessible', 'obtainable', 'free']),
('appointment', '予約、約束', '/əˈpɔɪntmənt/', 'noun', 1, 'She has an appointment with the client at 10 AM.', '彼女は午前10時にクライアントとの予約があります。', 'business', ARRAY['meeting', 'engagement', 'date']),
('attend', '出席する', '/əˈtend/', 'verb', 1, 'All employees are required to attend the annual meeting.', '全従業員は年次会議への出席が求められます。', 'business', ARRAY['participate', 'join', 'be present']),
('require', '必要とする', '/rɪˈkwaɪər/', 'verb', 1, 'This position requires three years of experience.', 'このポジションには3年の経験が必要です。', 'business', ARRAY['need', 'demand', 'necessitate']),
('submit', '提出する', '/səbˈmɪt/', 'verb', 1, 'Please submit your report by the end of the day.', '本日中にレポートを提出してください。', 'business', ARRAY['hand in', 'present', 'deliver']),
('budget', '予算', '/ˈbʌdʒɪt/', 'noun', 1, 'The marketing budget has been increased for this quarter.', '今四半期のマーケティング予算が増額されました。', 'finance', ARRAY['funds', 'allocation', 'finances']),
('invoice', '請求書', '/ˈɪnvɔɪs/', 'noun', 1, 'Please send the invoice to our accounting department.', '請求書を経理部門に送ってください。', 'finance', ARRAY['bill', 'statement', 'receipt']);

-- 700点レベル - ビジネス中級
INSERT INTO vocabulary (word, meaning, pronunciation, part_of_speech, level, example_sentence, example_translation, category, synonyms) VALUES
('negotiate', '交渉する', '/nɪˈɡoʊʃieɪt/', 'verb', 2, 'We need to negotiate better terms with our suppliers.', 'サプライヤーとより良い条件を交渉する必要があります。', 'business', ARRAY['bargain', 'discuss', 'deal']),
('implement', '実施する', '/ˈɪmplɪment/', 'verb', 2, 'The company will implement the new policy next month.', '会社は来月新しい方針を実施します。', 'business', ARRAY['execute', 'apply', 'carry out']),
('revenue', '収益', '/ˈrevənuː/', 'noun', 2, 'The company''s revenue increased by 15% this year.', '会社の収益は今年15%増加しました。', 'finance', ARRAY['income', 'earnings', 'proceeds']),
('anticipate', '予想する', '/ænˈtɪsɪpeɪt/', 'verb', 2, 'We anticipate strong demand for the new product.', '新製品への強い需要を予想しています。', 'business', ARRAY['expect', 'foresee', 'predict']),
('collaborate', '協力する', '/kəˈlæbəreɪt/', 'verb', 2, 'The two departments will collaborate on this project.', '2つの部門がこのプロジェクトで協力します。', 'business', ARRAY['cooperate', 'work together', 'partner']),
('efficient', '効率的な', '/ɪˈfɪʃnt/', 'adjective', 2, 'The new system is more efficient than the old one.', '新しいシステムは古いものより効率的です。', 'business', ARRAY['effective', 'productive', 'streamlined']),
('substantial', 'かなりの', '/səbˈstænʃl/', 'adjective', 2, 'There has been a substantial increase in sales.', '売上にかなりの増加がありました。', 'business', ARRAY['significant', 'considerable', 'major']),
('priority', '優先事項', '/praɪˈɔːrəti/', 'noun', 2, 'Customer satisfaction is our top priority.', '顧客満足が私たちの最優先事項です。', 'business', ARRAY['precedence', 'importance', 'preference']),
('acquisition', '買収', '/ˌækwɪˈzɪʃn/', 'noun', 2, 'The acquisition of the startup was completed last week.', 'そのスタートアップの買収は先週完了しました。', 'finance', ARRAY['purchase', 'takeover', 'merger']),
('compliance', '法令遵守', '/kəmˈplaɪəns/', 'noun', 2, 'All employees must ensure compliance with company policies.', '全従業員は会社方針の遵守を確保しなければなりません。', 'business', ARRAY['adherence', 'conformity', 'observance']);

-- 800点レベル - ビジネス上級
INSERT INTO vocabulary (word, meaning, pronunciation, part_of_speech, level, example_sentence, example_translation, category, synonyms) VALUES
('leverage', '活用する', '/ˈlevərɪdʒ/', 'verb', 3, 'We should leverage our existing customer base to promote the new service.', '新サービスを宣伝するために既存の顧客基盤を活用すべきです。', 'business', ARRAY['utilize', 'exploit', 'capitalize on']),
('streamline', '効率化する', '/ˈstriːmlaɪn/', 'verb', 3, 'The goal is to streamline our production process.', '目標は生産プロセスを効率化することです。', 'business', ARRAY['simplify', 'optimize', 'modernize']),
('scrutinize', '精査する', '/ˈskruːtənaɪz/', 'verb', 3, 'The auditors will scrutinize our financial records.', '監査人が財務記録を精査します。', 'finance', ARRAY['examine', 'inspect', 'analyze']),
('feasible', '実行可能な', '/ˈfiːzəbl/', 'adjective', 3, 'The proposal is technically feasible but financially challenging.', 'その提案は技術的には実行可能ですが、財政的には困難です。', 'business', ARRAY['viable', 'practical', 'achievable']),
('expedite', '迅速化する', '/ˈekspədaɪt/', 'verb', 3, 'We need to expedite the shipping process for this order.', 'この注文の出荷プロセスを迅速化する必要があります。', 'business', ARRAY['accelerate', 'hasten', 'speed up']),
('consolidate', '統合する', '/kənˈsɒlɪdeɪt/', 'verb', 3, 'The company plans to consolidate its regional offices.', '会社は地域オフィスを統合する計画です。', 'business', ARRAY['merge', 'combine', 'unite']),
('mitigate', '軽減する', '/ˈmɪtɪɡeɪt/', 'verb', 3, 'We must mitigate the risks associated with this project.', 'このプロジェクトに関連するリスクを軽減しなければなりません。', 'business', ARRAY['reduce', 'lessen', 'alleviate']),
('provisional', '暫定的な', '/prəˈvɪʒənl/', 'adjective', 3, 'This is only a provisional agreement pending final approval.', 'これは最終承認待ちの暫定的な合意に過ぎません。', 'business', ARRAY['temporary', 'interim', 'tentative']),
('depreciation', '減価償却', '/dɪˌpriːʃiˈeɪʃn/', 'noun', 3, 'The depreciation of equipment is calculated annually.', '設備の減価償却は毎年計算されます。', 'finance', ARRAY['devaluation', 'decline', 'decrease']),
('procurement', '調達', '/prəˈkjʊərmənt/', 'noun', 3, 'The procurement department handles all supplier contracts.', '調達部門がすべてのサプライヤー契約を扱います。', 'business', ARRAY['acquisition', 'purchasing', 'sourcing']);

-- =====================================================
-- 文法問題データ
-- =====================================================

-- 品詞問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
('The new policy will ------- take effect next month.', '["A) official", "B) officially", "C) officialize", "D) office"]', 'B', '動詞「take」を修飾するため、副詞「officially」が正解です。副詞は動詞、形容詞、他の副詞を修飾します。', 'parts_of_speech', 2, '副詞の位置：副詞は通常、修飾する動詞の前に置かれます。'),
('The marketing team made a ------- decision to launch the campaign early.', '["A) strategy", "B) strategic", "C) strategically", "D) strategize"]', 'B', '名詞「decision」を修飾するため、形容詞「strategic」が正解です。', 'parts_of_speech', 2, '形容詞の位置：形容詞は名詞の前に置いて修飾します。'),
('Customer ------- has been improving steadily over the past year.', '["A) satisfy", "B) satisfied", "C) satisfaction", "D) satisfying"]', 'C', '主語として機能する名詞が必要なため、「satisfaction」が正解です。', 'parts_of_speech', 2, '品詞の選択：文中での役割（主語、目的語など）に応じて適切な品詞を選びます。'),
('The company''s ------- growth exceeded all expectations.', '["A) remark", "B) remarked", "C) remarkable", "D) remarkably"]', 'C', '名詞「growth」を修飾する形容詞「remarkable」が正解です。', 'parts_of_speech', 3, '形容詞と副詞の区別：名詞を修飾するのは形容詞、動詞・形容詞・副詞を修飾するのは副詞です。');

-- 時制問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
('The manager ------- the meeting due to the unexpected circumstances.', '["A) postpone", "B) postponed", "C) postponing", "D) has postpone"]', 'B', '過去の出来事を表すため、過去形「postponed」が正解です。', 'tense', 2, '時制の一致：過去の出来事には過去形を使用します。'),
('By the time the CEO arrives, we ------- the presentation.', '["A) will finish", "B) finished", "C) will have finished", "D) are finishing"]', 'C', '未来のある時点までに完了することを表す未来完了形「will have finished」が正解です。', 'tense', 3, '未来完了形：「by the time...」のような未来の基準点を表す表現と一緒に使います。'),
('The company ------- its headquarters in Tokyo since 1985.', '["A) has", "B) had", "C) has had", "D) is having"]', 'C', '過去から現在まで継続していることを表す現在完了形「has had」が正解です。「since 1985」が現在完了形の手がかりです。', 'tense', 3, '現在完了形：since/forと一緒に使い、過去から現在までの継続を表します。'),
('When I called the office, the meeting ------- already.', '["A) starts", "B) started", "C) had started", "D) has started"]', 'C', '過去のある時点（called）より前に完了していたことを表す過去完了形「had started」が正解です。', 'tense', 3, '過去完了形：過去のある時点より前の出来事を表します。');

-- 関係詞問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
('The employee ------- sales performance was outstanding received a bonus.', '["A) who", "B) whose", "C) which", "D) whom"]', 'B', '「sales performance」を所有する関係を表すため、所有格の関係代名詞「whose」が正解です。', 'relative_clause', 3, '所有格の関係代名詞：whoseは「〜の」という所有関係を表し、後に名詞が続きます。'),
('This is the proposal ------- we discussed at the last meeting.', '["A) who", "B) what", "C) which", "D) whose"]', 'C', '先行詞「proposal」（物）を受ける関係代名詞「which」が正解です。または「that」も可。', 'relative_clause', 2, '関係代名詞の選択：人にはwho/whom、物にはwhich/thatを使います。'),
('The department ------- is responsible for customer service will be expanded.', '["A) what", "B) where", "C) who", "D) that"]', 'D', '先行詞「department」を受け、主語として機能する関係代名詞「that」（または「which」）が正解です。', 'relative_clause', 2, '関係代名詞の格：主語の役割をする場合はwho/which/thatを使います。');

-- 接続詞問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
('------- the weather improves, the outdoor event will be canceled.', '["A) Unless", "B) Because", "C) Although", "D) Since"]', 'A', '「天気が良くならなければ（＝良くならない限り）」という条件を表す「Unless」が正解です。', 'conjunction', 3, 'Unlessの用法：「〜しない限り」という否定的な条件を表します。'),
('The project was completed on time ------- we faced several challenges.', '["A) because", "B) although", "C) unless", "D) so that"]', 'B', '「困難に直面したにもかかわらず」という逆接を表す「although」が正解です。', 'conjunction', 2, '逆接の接続詞：although/though/even thoughは「〜にもかかわらず」を表します。'),
('Please review the contract carefully ------- signing it.', '["A) after", "B) during", "C) before", "D) while"]', 'C', '「署名する前に」確認するという時間的順序を表す「before」が正解です。', 'conjunction', 2, '時を表す接続詞：before/after/when/whileなどは動作の時間関係を表します。');

-- 前置詞問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
('The meeting is scheduled ------- 3 PM on Friday.', '["A) at", "B) in", "C) on", "D) by"]', 'A', '特定の時刻を表す場合は前置詞「at」を使います。', 'preposition', 1, '時を表す前置詞：atは時刻、onは日付・曜日、inは月・年・季節に使います。'),
('The company has been ------- business for over 50 years.', '["A) at", "B) in", "C) on", "D) with"]', 'B', '「in business」は「営業中、事業を行っている」という意味の慣用表現です。', 'preposition', 2, '前置詞の慣用表現：in business, on time, at workなど決まった組み合わせを覚えましょう。'),
('All employees must comply ------- the new safety regulations.', '["A) to", "B) for", "C) with", "D) by"]', 'C', '「comply with」で「〜に従う」という意味の熟語です。', 'preposition', 3, '動詞と前置詞の組み合わせ：comply with, depend on, apply forなど。');

-- 比較問題
INSERT INTO grammar_questions (question_text, options, correct_answer, explanation, category, difficulty, grammar_point) VALUES
('This year''s sales figures are ------- than last year''s.', '["A) good", "B) better", "C) best", "D) well"]', 'B', '「than」があるため比較級「better」が正解です。goodの比較級はbetterです。', 'comparison', 2, '不規則な比較級：good-better-best, bad-worse-worst, many/much-more-mostなど。'),
('This is the ------- effective marketing strategy we have ever used.', '["A) more", "B) much", "C) most", "D) very"]', 'C', '「we have ever used」は最上級と一緒に使われる表現で、「most」が正解です。', 'comparison', 2, '最上級の用法：「the + 最上級 + ever」は「今までで最も〜」を表します。'),
('The new model is twice ------- expensive as the previous one.', '["A) more", "B) so", "C) as", "D) most"]', 'C', '「twice as ... as」で「〜の2倍」を表す倍数表現です。', 'comparison', 3, '倍数表現：「X times as ... as」で「〜のX倍」を表します。');
