import { unstable_cache } from "next/cache"

/**
 * キャッシュ時間の定数（秒）
 */
export const CACHE_TIMES = {
  SHORT: 900,        // 15分
  MEDIUM: 1800,      // 30分
  LONG: 3600,        // 1時間
  VERY_LONG: 7200,   // 2時間
  EXTRA_LONG: 14400, // 4時間
} as const

/**
 * キャッシュタグの定数
 */
export const CACHE_TAGS = {
  ANALYTICS: "analytics",
  DASHBOARD: "dashboard",
  GRAMMAR: "grammar",
  VOCABULARY: "vocabulary",
  READING: "reading",
  PROGRESS: "progress",
} as const

/**
 * ユーザー固有のキャッシュ関数を作成
 *
 * @param fn - キャッシュする関数
 * @param keyParts - キャッシュキーの構成要素
 * @param revalidateSeconds - キャッシュの有効期間（秒）
 * @param tags - キャッシュタグ（revalidateTagで無効化に使用）
 */
export function createUserCache<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  revalidateSeconds: number,
  tags?: string[]
): Promise<T> {
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate: revalidateSeconds,
      tags: tags,
    }
  )()
}

/**
 * 分析データ用のキャッシュを作成
 */
export function createAnalyticsCache<T>(
  fn: () => Promise<T>,
  userId: string,
  cacheKey: string,
  revalidateSeconds: number = CACHE_TIMES.VERY_LONG
): Promise<T> {
  return createUserCache(
    fn,
    [`analytics-${cacheKey}-${userId}`],
    revalidateSeconds,
    [CACHE_TAGS.ANALYTICS, `user-${userId}`]
  )
}

/**
 * ダッシュボード用のキャッシュを作成
 */
export function createDashboardCache<T>(
  fn: () => Promise<T>,
  userId: string,
  cacheKey: string,
  revalidateSeconds: number = CACHE_TIMES.MEDIUM
): Promise<T> {
  return createUserCache(
    fn,
    [`dashboard-${cacheKey}-${userId}`],
    revalidateSeconds,
    [CACHE_TAGS.DASHBOARD, `user-${userId}`]
  )
}
