'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import {
  insertGameResult,
  getDailyGameResultForUser,
} from '@/lib/dal/game_results'

const dailyResultSchema = z.object({
  dailyGameId: z.uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

export async function submitDailyResult(
  dailyGameId: string,
  guessElo: number,
  actualElo: number,
  score: number
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const parsed = dailyResultSchema.safeParse({
    dailyGameId,
    guessElo,
    actualElo,
    score,
  })
  if (!parsed.success) return

  const existing = await getDailyGameResultForUser(user.id, dailyGameId)
  if (existing) return

  await insertGameResult({
    userId: user.id,
    dailyGameId: parsed.data.dailyGameId,
    guessElo: parsed.data.guessElo,
    actualElo: parsed.data.actualElo,
    score: parsed.data.score,
  })
}
