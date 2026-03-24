import 'server-only'
import { createClient } from '@/utils/supabase/server'

export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string | null
  score: number
  guessElo: number
  actualElo: number
}

type GameResultData = {
  userId: string
  gameId: string
  guessElo: number
  actualElo: number
  score: number
}

type GameResult = {
  guessElo: number
  actualElo: number
  score: number
}

export async function insertGameResult(data: GameResultData): Promise<void> {
  const supabase = await createClient()
  await supabase.from('game_results').insert({
    user_id: data.userId,
    game_id: data.gameId,
    guess_elo: data.guessElo,
    actual_elo: data.actualElo,
    score: data.score,
    mode: 'daily',
  })
}

export async function getDailyGameResultForUser(
  userId: string,
  gameId: string
): Promise<GameResult | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('game_results')
    .select('guess_elo, actual_elo, score')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .eq('mode', 'daily')
    .is('deleted_at', null)
    .single()

  if (!data) return null
  return {
    guessElo: data.guess_elo,
    actualElo: data.actual_elo,
    score: data.score,
  }
}

export async function getResultsForDailyGames(
  userId: string,
  gameIds: string[]
): Promise<Map<string, number>> {
  if (gameIds.length === 0) return new Map()
  const supabase = await createClient()
  const { data } = await supabase
    .from('game_results')
    .select('game_id, score')
    .eq('user_id', userId)
    .in('game_id', gameIds)
    .eq('mode', 'daily')
    .is('deleted_at', null)
  const map = new Map<string, number>()
  for (const row of data ?? []) {
    map.set(row.game_id, row.score)
  }
  return map
}

export type DailyHistoryEntry = {
  date: string
  score: number
}

export async function getUserDailyHistory(
  userId: string
): Promise<DailyHistoryEntry[]> {
  const supabase = await createClient()
  const { data: results } = await supabase
    .from('game_results')
    .select('game_id, score')
    .eq('user_id', userId)
    .eq('mode', 'daily')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!results?.length) return []

  const { data: schedules } = await supabase
    .from('daily_schedule')
    .select('game_id, scheduled_for')
    .in(
      'game_id',
      results.map((r) => r.game_id)
    )
    .is('deleted_at', null)

  const dateMap = new Map(
    (schedules ?? []).map((s) => [s.game_id, s.scheduled_for])
  )

  return results.map((row) => ({
    date: dateMap.get(row.game_id) ?? '',
    score: row.score,
  }))
}

export async function getDailyLeaderboard(
  gameId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  const { data: results } = await supabase
    .from('game_results')
    .select('user_id, score, guess_elo, actual_elo')
    .eq('game_id', gameId)
    .eq('mode', 'daily')
    .is('deleted_at', null)
    .order('score', { ascending: false })
    .limit(50)

  if (!results || results.length === 0) return []

  const userIds = results.map((r) => r.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)

  const usernameMap = new Map(profiles?.map((p) => [p.id, p.username]) ?? [])

  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    username: usernameMap.get(r.user_id) ?? null,
    score: r.score,
    guessElo: r.guess_elo,
    actualElo: r.actual_elo,
  }))
}
