import 'server-only'
import { createClient } from '@/utils/supabase/server'

type GameResultData = {
  userId: string
  dailyGameId: string
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
    daily_game_id: data.dailyGameId,
    guess_elo: data.guessElo,
    actual_elo: data.actualElo,
    score: data.score,
    mode: 'daily',
  })
}

export async function getDailyGameResultForUser(
  userId: string,
  dailyGameId: string
): Promise<GameResult | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('game_results')
    .select('guess_elo, actual_elo, score')
    .eq('user_id', userId)
    .eq('daily_game_id', dailyGameId)
    .is('deleted_at', null)
    .single()

  if (!data) return null
  return {
    guessElo: data.guess_elo,
    actualElo: data.actual_elo,
    score: data.score,
  }
}
