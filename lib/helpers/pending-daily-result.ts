import {
  getDailyGameResultForUser,
  insertGameResult,
} from '@/lib/dal/game_results'
import { updateStreak } from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

const pendingResultSchema = z.object({
  gameId: z.string().uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

/**
 * If an anonymous daily result cookie exists, claim it for the currently
 * authenticated user. Safe to call after sign-up or OAuth callback — the
 * idempotency check in the DAL prevents double-saves.
 */
export async function savePendingDailyResult(): Promise<void> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('dte_daily_result')?.value
  if (!raw) return

  let parsed: ReturnType<typeof pendingResultSchema.safeParse>
  try {
    parsed = pendingResultSchema.safeParse(JSON.parse(decodeURIComponent(raw)))
  } catch {
    return
  }
  if (!parsed.success) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Verify the stored gameId matches today's scheduled game
  const today = new Date().toISOString().split('T')[0]
  const { data: todaysGame } = await supabase
    .from('daily_schedule')
    .select('games!inner(id)')
    .eq('scheduled_for', today)
    .is('deleted_at', null)
    .single()
  const todaysGameId = (todaysGame?.games as { id: string } | null)?.id
  if (todaysGameId !== parsed.data.gameId) return

  const existing = await getDailyGameResultForUser(user.id, parsed.data.gameId)
  if (existing) {
    cookieStore.delete('dte_daily_result')
    return
  }

  await insertGameResult({
    userId: user.id,
    gameId: parsed.data.gameId,
    guessElo: parsed.data.guessElo,
    actualElo: parsed.data.actualElo,
    score: parsed.data.score,
  })
  await updateStreak(user.id)
  cookieStore.delete('dte_daily_result')
}
