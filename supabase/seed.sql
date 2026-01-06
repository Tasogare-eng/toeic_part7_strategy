-- サンプル問題1: Email
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Office Renovation Notice',
  'email',
  E'From: facilities@techcorp.com\nTo: All Employees\nSubject: Upcoming Office Renovation\n\nDear Team,\n\nWe are pleased to announce that our office will undergo a major renovation starting next month. The project aims to create a more collaborative and modern workspace.\n\nKey dates:\n- Phase 1 (3rd floor): March 1-15\n- Phase 2 (2nd floor): March 16-31\n\nDuring the renovation, affected departments will be relocated to the temporary workspace on the 5th floor. Please pack your personal belongings by February 28.\n\nIf you have any questions, please contact the Facilities team.\n\nBest regards,\nFacilities Management',
  3
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'What is the main purpose of this email?',
  'main_idea',
  '["To request employees to work from home", "To announce office renovation plans", "To introduce new team members", "To change company policies"]',
  1,
  'The email clearly states "our office will undergo a major renovation" and provides details about the schedule.',
  0
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'When should employees pack their belongings?',
  'detail',
  '["By March 1", "By March 15", "By February 28", "By March 31"]',
  2,
  'The email specifically states "Please pack your personal belongings by February 28."',
  1
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Where will affected departments be relocated?',
  'detail',
  '["To the 2nd floor", "To the 3rd floor", "To the 5th floor", "To a different building"]',
  2,
  'The email mentions "relocated to the temporary workspace on the 5th floor."',
  2
);

-- サンプル問題2: Article
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'New Product Launch Success',
  'article',
  E'Tech Innovations Inc. Reports Record-Breaking Sales\n\nSAN FRANCISCO - Tech Innovations Inc. announced yesterday that its latest smartphone, the TI-X1, has exceeded all sales expectations in its first month on the market.\n\nThe device, which features an innovative foldable screen and advanced AI capabilities, sold over 2 million units worldwide within the first three weeks of its release. This represents a 40% increase compared to the company''s previous flagship model.\n\n"We are thrilled with the market response," said CEO Maria Chen. "The TI-X1 represents years of research and development, and it''s gratifying to see consumers embrace our vision for the future of mobile technology."\n\nAnalysts attribute the success to the phone''s unique design and competitive pricing strategy. The TI-X1 is priced at $899, significantly lower than comparable foldable devices from competitors.\n\nThe company plans to expand production capacity to meet the growing demand and expects to ship an additional 3 million units by the end of the quarter.',
  4
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'What is the article mainly about?',
  'main_idea',
  '["A company''s financial problems", "The successful launch of a new product", "A CEO''s retirement announcement", "A merger between two companies"]',
  1,
  'The article discusses the successful launch and sales of the TI-X1 smartphone.',
  1
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'How many units were sold in the first three weeks?',
  'detail',
  '["1 million", "2 million", "3 million", "4 million"]',
  1,
  'The article states "sold over 2 million units worldwide within the first three weeks."',
  2
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'What can be inferred about the TI-X1''s pricing?',
  'inference',
  '["It is the most expensive phone on the market", "It is priced lower than similar products", "The price will increase soon", "It is only available in limited markets"]',
  1,
  'The article mentions the phone is "priced at $899, significantly lower than comparable foldable devices."',
  3
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'The word "embrace" in paragraph 3 is closest in meaning to',
  'vocabulary',
  '["reject", "accept enthusiastically", "ignore", "criticize"]',
  1,
  '"Embrace" means to accept or support something willingly or enthusiastically.',
  4
);

-- サンプル問題3: Notice
INSERT INTO public.reading_passages (id, title, document_type, content, difficulty)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Library Policy Update',
  'notice',
  E'WESTFIELD PUBLIC LIBRARY\nIMPORTANT NOTICE TO ALL PATRONS\n\nEffective April 1, the following changes to library policies will take effect:\n\nBorrowing Limits\n- Adult cardholders: Maximum 15 items (increased from 10)\n- Children/Teen cardholders: Maximum 10 items (increased from 7)\n- Digital materials: Maximum 5 items per category\n\nLoan Periods\n- Books and audiobooks: 3 weeks (no change)\n- DVDs and Blu-rays: 1 week (reduced from 2 weeks)\n- Magazines: 1 week (no change)\n\nLate Fees\nWe are pleased to announce the elimination of all late fees for overdue materials. However, patrons with items more than 30 days overdue will have their borrowing privileges suspended until the items are returned.\n\nNew Services\n- Online reservation system for study rooms\n- Expanded digital collection including academic journals\n- Free museum passes available for checkout\n\nFor questions about these changes, please visit the information desk or call (555) 123-4567.',
  2
);

INSERT INTO public.reading_questions (passage_id, question_text, question_type, options, correct_answer, explanation, order_index)
VALUES
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'What is the purpose of this notice?',
  'purpose',
  '["To announce library closure", "To inform about policy changes", "To recruit new staff", "To promote a book sale"]',
  1,
  'The notice clearly states it is informing patrons about policy changes effective April 1.',
  1
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'How has the DVD loan period changed?',
  'detail',
  '["It increased to 2 weeks", "It decreased to 1 week", "It stayed the same", "DVDs are no longer available"]',
  1,
  'The notice states DVDs now have a 1-week loan period, "reduced from 2 weeks."',
  2
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'What happens if a patron keeps an item for more than 30 days?',
  'detail',
  '["They must pay a fine", "Their account is deleted", "They cannot borrow until items are returned", "Nothing happens"]',
  2,
  'The notice states patrons with items "more than 30 days overdue will have their borrowing privileges suspended."',
  3
);
