'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import {
  insertGameResult,
  getDailyGameResultForUser,
} from '@/lib/dal/game_results'
import { updateStreak } from '@/lib/dal/profiles'

const dailyResultSchema = z.object({
  gameId: z.string().uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

export async function submitDailyResult(
  gameId: string,
  guessElo: number,
  actualElo: number,
  score: number
): Promise<{ alreadySubmitted: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { alreadySubmitted: false }

  const parsed = dailyResultSchema.safeParse({
    gameId,
    guessElo,
    actualElo,
    score,
  })
  if (!parsed.success) return { alreadySubmitted: false }

  const existing = await getDailyGameResultForUser(user.id, gameId)
  if (existing) return { alreadySubmitted: true }

  await insertGameResult({
    userId: user.id,
    gameId: parsed.data.gameId,
    guessElo: parsed.data.guessElo,
    actualElo: parsed.data.actualElo,
    score: parsed.data.score,
  })
  await updateStreak(user.id)
  return { alreadySubmitted: false }
}
