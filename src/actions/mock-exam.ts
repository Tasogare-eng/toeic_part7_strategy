"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  MockExamType,
  MockExamConfig,
  MockExam,
  MockExamQuestionWithData,
  MockExamResult,
  MockExamResultWithExam,
  MOCK_EXAM_CONFIGS,
} from "@/types/mock-exam"
import { canUseFeature } from "./usage"
import type { FeatureCheckResult } from "@/types/subscription"

const EXAM_CONFIGS: Record<MockExamType, MockExamConfig> = {
  full: {
    type: "full",
    label: "フル模試",
    description: "本番と同じ100問形式",
    timeLimit: 75,
    part5Count: 30,
    part6Count: 16,
    part7Count: 54,
  },
  mini_30: {
    type: "mini_30",
    label: "ミニ模試 30分",
    description: "短時間で実力チェック",
    timeLimit: 30,
    part5Count: 15,
    part6Count: 4,
    part7Count: 10,
  },
  mini_15: {
    type: "mini_15",
    label: "ミニ模試 15分",
    description: "スキマ時間で練習",
    timeLimit: 15,
    part5Count: 10,
    part6Count: 0,
    part7Count: 5,
  },
}

interface CollectedQuestion {
  part: "part5" | "part6" | "part7"
  questionType: "grammar" | "reading"
  questionId: string
  passageId?: string
  isAiGenerated: boolean
}

// 模試を開始
export interface StartMockExamResult {
  examId?: string
  featureLocked?: boolean
  featureCheck?: FeatureCheckResult
}

export async function startMockExam(
  examType: MockExamType
): Promise<StartMockExamResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  // Pro限定機能チェック
  const featureCheck = await canUseFeature("mock_exam")
  if (!featureCheck.allowed) {
    return {
      featureLocked: true,
      featureCheck,
    }
  }

  const config = EXAM_CONFIGS[examType]

  // 進行中の模試があるかチェック
  const { data: existingExam } = await supabase
    .from("mock_exams")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .single()

  if (existingExam) {
    throw new Error("進行中の模試があります。先に完了するか中断してください。")
  }

  // 1. 模試レコード作成
  const { data: exam, error: examError } = await supabase
    .from("mock_exams")
    .insert({
      user_id: user.id,
      exam_type: examType,
      time_limit_minutes: config.timeLimit,
    })
    .select()
    .single()

  if (examError) throw examError

  // 2. 問題を収集（DB優先）
  const questions = await collectQuestionsForExam(config)

  // 3. 問題をmock_exam_questionsに登録
  const questionRecords = questions.map((q, index) => ({
    mock_exam_id: exam.id,
    part: q.part,
    question_type: q.questionType,
    question_id: q.questionId,
    passage_id: q.passageId || null,
    order_index: index,
    is_ai_generated: q.isAiGenerated,
  }))

  const { error: questionsError } = await supabase
    .from("mock_exam_questions")
    .insert(questionRecords)

  if (questionsError) throw questionsError

  revalidatePath("/mock-exam")
  return { examId: exam.id }
}

// 問題収集ロジック
async function collectQuestionsForExam(
  config: MockExamConfig
): Promise<CollectedQuestion[]> {
  const supabase = await createClient()
  const questions: CollectedQuestion[] = []

  // Part5: 文法問題
  if (config.part5Count > 0) {
    const { data: grammarQuestions } = await supabase
      .from("grammar_questions")
      .select("id")
      .limit(config.part5Count * 2)

    const shuffledGrammar = (grammarQuestions || []).sort(
      () => Math.random() - 0.5
    )

    for (const q of shuffledGrammar.slice(0, config.part5Count)) {
      questions.push({
        part: "part5",
        questionType: "grammar",
        questionId: q.id,
        isAiGenerated: false,
      })
    }
  }

  // Part6: 文法問題（パッセージ付きは将来対応）
  // 現在は文法問題で代用
  if (config.part6Count > 0) {
    const { data: grammarQuestions } = await supabase
      .from("grammar_questions")
      .select("id")
      .limit(config.part6Count * 2)

    const shuffledGrammar = (grammarQuestions || []).sort(
      () => Math.random() - 0.5
    )

    for (const q of shuffledGrammar.slice(0, config.part6Count)) {
      questions.push({
        part: "part6",
        questionType: "grammar",
        questionId: q.id,
        isAiGenerated: false,
      })
    }
  }

  // Part7: 長文問題
  if (config.part7Count > 0) {
    const { data: passages } = await supabase
      .from("reading_passages")
      .select(
        `
        id,
        reading_questions(id)
      `
      )
      .limit(20)

    const shuffledPassages = (passages || []).sort(() => Math.random() - 0.5)
    let readingCount = 0

    for (const passage of shuffledPassages) {
      if (readingCount >= config.part7Count) break
      const passageQuestions = (passage.reading_questions || []) as { id: string }[]
      for (const q of passageQuestions) {
        if (readingCount >= config.part7Count) break
        questions.push({
          part: "part7",
          questionType: "reading",
          questionId: q.id,
          passageId: passage.id,
          isAiGenerated: false,
        })
        readingCount++
      }
    }
  }

  return questions
}

// 模試情報を取得
export async function getMockExam(examId: string): Promise<MockExam | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("mock_exams")
    .select("*")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()

  return data
}

// 模試問題を取得
export async function getMockExamQuestions(
  examId: string
): Promise<MockExamQuestionWithData[]> {
  const supabase = await createClient()

  const { data: questions } = await supabase
    .from("mock_exam_questions")
    .select("*")
    .eq("mock_exam_id", examId)
    .order("order_index")

  if (!questions) return []

  // 各問題の詳細を取得
  const questionsWithData: MockExamQuestionWithData[] = []

  for (const q of questions) {
    const questionWithData: MockExamQuestionWithData = { ...q }

    if (q.question_type === "grammar") {
      const { data: grammarQuestion } = await supabase
        .from("grammar_questions")
        .select("id, question_text, options, correct_answer, explanation, category, grammar_point")
        .eq("id", q.question_id)
        .single()
      questionWithData.grammar_question = grammarQuestion || undefined
    } else if (q.question_type === "reading") {
      const { data: readingQuestion } = await supabase
        .from("reading_questions")
        .select("id, question_text, options, correct_answer, explanation, question_type")
        .eq("id", q.question_id)
        .single()
      questionWithData.reading_question = readingQuestion || undefined

      if (q.passage_id) {
        const { data: passage } = await supabase
          .from("reading_passages")
          .select("id, title, content, document_type, difficulty")
          .eq("id", q.passage_id)
          .single()
        questionWithData.passage = passage || undefined
      }
    }

    questionsWithData.push(questionWithData)
  }

  return questionsWithData
}

// 回答済みの回答を取得
export async function getMockExamAnswers(examId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("mock_exam_answers")
    .select("*")
    .eq("mock_exam_id", examId)

  return data || []
}

// 回答を送信
export async function submitMockExamAnswer(
  examId: string,
  questionId: string,
  selectedAnswer: string,
  timeSpentSeconds: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  // 問題情報を取得
  const { data: mockQuestion } = await supabase
    .from("mock_exam_questions")
    .select("question_type, question_id")
    .eq("id", questionId)
    .single()

  if (!mockQuestion) throw new Error("問題が見つかりません")

  // 正解判定
  let isCorrect = false

  if (mockQuestion.question_type === "grammar") {
    const { data: grammar } = await supabase
      .from("grammar_questions")
      .select("correct_answer")
      .eq("id", mockQuestion.question_id)
      .single()
    isCorrect = grammar?.correct_answer === selectedAnswer
  } else {
    const { data: reading } = await supabase
      .from("reading_questions")
      .select("correct_answer")
      .eq("id", mockQuestion.question_id)
      .single()
    // reading_questionsのcorrect_answerは数値（0-3）
    // selectedAnswerは"A", "B", "C", "D"の場合
    const answerIndex = ["A", "B", "C", "D"].indexOf(selectedAnswer)
    isCorrect = reading?.correct_answer === answerIndex
  }

  // 回答を保存（upsert）
  const { error } = await supabase.from("mock_exam_answers").upsert(
    {
      mock_exam_id: examId,
      mock_question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "mock_exam_id,mock_question_id" }
  )

  if (error) throw error

  return { isCorrect }
}

// 模試を完了
export async function completeMockExam(examId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  // 模試が存在し、自分のものかチェック
  const { data: exam } = await supabase
    .from("mock_exams")
    .select("*")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()

  if (!exam) throw new Error("模試が見つかりません")

  // 結果を集計
  const { data: questions } = await supabase
    .from("mock_exam_questions")
    .select("id, part")
    .eq("mock_exam_id", examId)

  const { data: answers } = await supabase
    .from("mock_exam_answers")
    .select("mock_question_id, is_correct, time_spent_seconds")
    .eq("mock_exam_id", examId)

  const answersMap = new Map(
    (answers || []).map((a) => [a.mock_question_id, a])
  )

  const stats = {
    total: 0,
    correct: 0,
    part5Total: 0,
    part5Correct: 0,
    part6Total: 0,
    part6Correct: 0,
    part7Total: 0,
    part7Correct: 0,
    totalTime: 0,
  }

  for (const question of questions || []) {
    stats.total++
    const answer = answersMap.get(question.id)

    if (answer) {
      stats.totalTime += answer.time_spent_seconds || 0
      if (answer.is_correct) stats.correct++
    }

    if (question.part === "part5") {
      stats.part5Total++
      if (answer?.is_correct) stats.part5Correct++
    } else if (question.part === "part6") {
      stats.part6Total++
      if (answer?.is_correct) stats.part6Correct++
    } else if (question.part === "part7") {
      stats.part7Total++
      if (answer?.is_correct) stats.part7Correct++
    }
  }

  // 予測スコア計算（簡易版: 200-990の範囲）
  const accuracy = stats.total > 0 ? stats.correct / stats.total : 0
  const estimatedScore = Math.round(200 + accuracy * 790)

  // 模試ステータス更新
  await supabase
    .from("mock_exams")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", examId)

  // 結果保存
  const { error: resultError } = await supabase
    .from("mock_exam_results")
    .insert({
      mock_exam_id: examId,
      user_id: user.id,
      total_questions: stats.total,
      correct_count: stats.correct,
      part5_total: stats.part5Total,
      part5_correct: stats.part5Correct,
      part6_total: stats.part6Total,
      part6_correct: stats.part6Correct,
      part7_total: stats.part7Total,
      part7_correct: stats.part7Correct,
      total_time_seconds: stats.totalTime,
      estimated_score: estimatedScore,
    })

  if (resultError) throw resultError

  revalidatePath("/mock-exam")
  return { examId, stats, estimatedScore }
}

// 模試を中断
export async function abandonMockExam(examId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { error } = await supabase
    .from("mock_exams")
    .update({ status: "abandoned", completed_at: new Date().toISOString() })
    .eq("id", examId)
    .eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/mock-exam")
}

// 進行中の模試を取得
export async function getInProgressMockExam(): Promise<MockExam | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("mock_exams")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .single()

  return data
}

// 模試結果一覧を取得
export async function getMockExamResults(): Promise<MockExamResultWithExam[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("mock_exam_results")
    .select(
      `
      *,
      mock_exam:mock_exams(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (data || []) as MockExamResultWithExam[]
}

// 単一の模試結果を取得
export async function getMockExamResult(
  examId: string
): Promise<MockExamResultWithExam | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("mock_exam_results")
    .select(
      `
      *,
      mock_exam:mock_exams(*)
    `
    )
    .eq("mock_exam_id", examId)
    .single()

  return data as MockExamResultWithExam | null
}
