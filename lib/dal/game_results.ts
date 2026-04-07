import 'server-only'
import { createClient } from '@/utils/supabase/server'

export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string | null
  avatarSlug: string | null
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

type RankedGameResultData = {
  userId: string
  gameId: string
  rankedSessionId: string
  roundNumber: number
  guessElo: number
  actualElo: number
  score: number
  ratingChange: number
  ratingAfter: number
}

export type RoundResult = {
  roundNumber: number
  gameId: string
  guessElo: number
  actualElo: number
  score: number
  ratingChange: number
  ratingAfter: number
}

export async function insertRankedGameResult(
  data: RankedGameResultData
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('game_results').insert({
    user_id: data.userId,
    game_id: data.gameId,
    ranked_session_id: data.rankedSessionId,
    round_number: data.roundNumber,
    guess_elo: data.guessElo,
    actual_elo: data.actualElo,
    score: data.score,
    rating_change: data.ratingChange,
    rating_after: data.ratingAfter,
    mode: 'ranked',
  })
}

export async function getRankedSessionResults(
  sessionId: string
): Promise<RoundResult[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('game_results')
    .select(
      'round_number, game_id, guess_elo, actual_elo, score, rating_change, rating_after'
    )
    .eq('ranked_session_id', sessionId)
    .eq('mode', 'ranked')
    .is('deleted_at', null)
    .order('round_number', { ascending: true })

  return (data ?? []).map((r) => ({
    roundNumber: r.round_number!,
    gameId: r.game_id,
    guessElo: r.guess_elo,
    actualElo: r.actual_elo,
    score: r.score,
    ratingChange: r.rating_change!,
    ratingAfter: r.rating_after!,
  }))
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

export async function getUserDailyLeaderboardEntry(
  gameId: string,
  userId: string
): Promise<LeaderboardEntry | null> {
  const supabase = await createClient()

  const { data: result } = await supabase
    .from('game_results')
    .select('score, guess_elo, actual_elo')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .eq('mode', 'daily')
    .is('deleted_at', null)
    .single()

  if (!result) return null

  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_slug')
      .eq('id', userId)
      .single(),
    supabase
      .from('game_results')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('mode', 'daily')
      .is('deleted_at', null)
      .gt('score', result.score),
  ])

  return {
    rank: (count ?? 0) + 1,
    userId,
    username: profile?.username ?? null,
    avatarSlug: profile?.avatar_slug ?? null,
    score: result.score,
    guessElo: result.guess_elo,
    actualElo: result.actual_elo,
  }
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
    .limit(10)

  if (!results || results.length === 0) return []

  const userIds = results.map((r) => r.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_slug')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    username: profileMap.get(r.user_id)?.username ?? null,
    avatarSlug: profileMap.get(r.user_id)?.avatar_slug ?? null,
    score: r.score,
    guessElo: r.guess_elo,
    actualElo: r.actual_elo,
  }))
}
