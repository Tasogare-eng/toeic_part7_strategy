"use server"

import { createClient } from "@/lib/supabase/server"
import type { PassageWithQuestions, PassageWithProgress, UserAnswer } from "@/types/database"
import { incrementUsage, canUseUsage } from "./usage"
import type { UsageCheckResult } from "@/types/subscription"

export async function getPassages(): Promise<PassageWithProgress[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // 問題一覧と各問題の設問数を取得
  const { data: passages } = await supabase
    .from("reading_passages")
    .select(`
      *,
      reading_questions(count)
    `)
    .order("created_at", { ascending: false })

  if (!passages) return []

  // ユーザーの回答状況を取得
  const { data: answers } = await supabase
    .from("user_answers")
    .select("passage_id, is_correct")
    .eq("user_id", user.id)

  const answersByPassage = (answers || []).reduce((acc, answer) => {
    if (!acc[answer.passage_id]) {
      acc[answer.passage_id] = { answered: 0, correct: 0 }
    }
    acc[answer.passage_id].answered++
    if (answer.is_correct) acc[answer.passage_id].correct++
    return acc
  }, {} as Record<string, { answered: number; correct: number }>)

  return passages.map((passage) => ({
    ...passage,
    question_count: passage.reading_questions[0]?.count || 0,
    user_progress: answersByPassage[passage.id]
      ? {
          answered_count: answersByPassage[passage.id].answered,
          correct_count: answersByPassage[passage.id].correct,
        }
      : null,
  }))
}

export async function getPassageWithQuestions(
  passageId: string
): Promise<PassageWithQuestions | null> {
  const supabase = await createClient()

  const { data: passage } = await supabase
    .from("reading_passages")
    .select(`
      *,
      questions:reading_questions(*)
    `)
    .eq("id", passageId)
    .single()

  if (!passage) return null

  return {
    ...passage,
    questions: passage.questions.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
  }
}

export interface SubmitAnswersResult {
  success: boolean
  results: UserAnswer[]
  limitReached?: boolean
  usage?: UsageCheckResult
}

export async function submitAnswers(
  passageId: string,
  answers: { questionId: string; selectedAnswer: number; timeSpent: number }[]
): Promise<SubmitAnswersResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, results: [] }
  }

  // 利用制限チェック
  const usageCheck = await canUseUsage("reading")
  if (!usageCheck.allowed) {
    return {
      success: false,
      results: [],
      limitReached: true,
      usage: usageCheck,
    }
  }

  // 正答を取得
  const { data: questions } = await supabase
    .from("reading_questions")
    .select("id, correct_answer")
    .eq("passage_id", passageId)

  if (!questions) {
    return { success: false, results: [] }
  }

  const correctAnswerMap = questions.reduce((acc, q) => {
    acc[q.id] = q.correct_answer
    return acc
  }, {} as Record<string, number>)

  // 回答を保存
  const answersToInsert = answers.map((answer) => ({
    user_id: user.id,
    question_id: answer.questionId,
    passage_id: passageId,
    selected_answer: answer.selectedAnswer,
    is_correct: correctAnswerMap[answer.questionId] === answer.selectedAnswer,
    time_spent_seconds: answer.timeSpent,
  }))

  const { data: insertedAnswers, error } = await supabase
    .from("user_answers")
    .upsert(answersToInsert, { onConflict: "user_id,question_id" })
    .select()

  if (error) {
    console.error("Error submitting answers:", error)
    return { success: false, results: [] }
  }

  // 利用回数をインクリメント
  const usageResult = await incrementUsage("reading")

  return {
    success: true,
    results: insertedAnswers || [],
    usage: usageResult,
  }
}

export async function getPassageResults(passageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: passage } = await supabase
    .from("reading_passages")
    .select(`
      *,
      questions:reading_questions(*)
    `)
    .eq("id", passageId)
    .single()

  const { data: answers } = await supabase
    .from("user_answers")
    .select("*")
    .eq("user_id", user.id)
    .eq("passage_id", passageId)

  if (!passage) return null

  return {
    passage,
    questions: passage.questions.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
    answers: answers || [],
  }
}
