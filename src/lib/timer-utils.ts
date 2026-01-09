// 推奨時間の定義（秒）
export const RECOMMENDED_TIME = {
  reading: {
    single_passage: 180, // 3分
    double_passage: 300, // 5分
    triple_passage: 420, // 7分
  },
  grammar: {
    easy: 30, // 30秒
    medium: 45, // 45秒
    hard: 60, // 1分
  },
  vocabulary: {
    flashcard: 10, // 10秒
    test: 15, // 15秒
  },
}

// 難易度から推奨時間を取得
export function getGrammarRecommendedTime(difficulty: number): number {
  if (difficulty <= 2) return RECOMMENDED_TIME.grammar.easy
  if (difficulty <= 4) return RECOMMENDED_TIME.grammar.medium
  return RECOMMENDED_TIME.grammar.hard
}

// 時間をフォーマット（秒 → "Xh Ym" または "Xm Ys"）
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`
}

// 短い時間フォーマット（タイマー表示用）
export function formatTimeShort(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
