'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import {
  createRankedSession,
  getActiveRankedSession,
  completeRankedSession,
} from '@/lib/dal/ranked_sessions'
import {
  insertRankedGameResult,
  getRankedSessionResults,
} from '@/lib/dal/game_results'
import { getProfileByUserId, updateUserRating } from '@/lib/dal/profiles'
import { calculateRatingChange, RANKED_ROUNDS } from '@/lib/chess/scoring'

export async function startRankedSession(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Idempotent: don't create a second session if one is already active
  const existing = await getActiveRankedSession(user.id)
  if (existing) return {}

  const profile = await getProfileByUserId(user.id)
  const ratingBefore = profile?.rating ?? 1200

  const session = await createRankedSession(user.id, ratingBefore)
  if (!session) return { error: 'Failed to create session' }

  return {}
}

const submitRankedRoundSchema = z.object({
  sessionId: z.string().uuid(),
  roundNumber: z.number().int().min(1).max(RANKED_ROUNDS),
  gameId: z.string().uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

export type SubmitRankedRoundResult =
  | {
      ratingChange: number
      ratingAfter: number
      error?: never
    }
  | { error: string; ratingChange?: never; ratingAfter?: never }

export async function submitRankedRound(
  params: z.infer<typeof submitRankedRoundSchema>
): Promise<SubmitRankedRoundResult> {
  const parsed = submitRankedRoundSchema.safeParse(params)
  if (!parsed.success) return { error: 'Invalid input' }

  const { sessionId, roundNumber, gameId, guessElo, actualElo, score } =
    parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify session belongs to user and is active
  const { data: session } = await supabase
    .from('ranked_sessions')
    .select('id, user_id, status, rating_before')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
  if (!session) return { error: 'Session not found or already completed' }

  // Idempotent: return existing result if this round was already submitted
  const existingResults = await getRankedSessionResults(sessionId)
  const existing = existingResults.find((r) => r.roundNumber === roundNumber)
  if (existing) {
    return {
      ratingChange: existing.ratingChange,
      ratingAfter: existing.ratingAfter,
    }
  }

  // Compute current rating from previous rounds (never trust client)
  const previousRounds = existingResults.filter(
    (r) => r.roundNumber < roundNumber
  )
  const currentRating =
    previousRounds.length > 0
      ? previousRounds[previousRounds.length - 1]!.ratingAfter
      : session.rating_before

  const ratingChange = calculateRatingChange(currentRating, score)
  const ratingAfter = currentRating + ratingChange

  await insertRankedGameResult({
    userId: user.id,
    gameId,
    rankedSessionId: sessionId,
    roundNumber,
    guessElo,
    actualElo,
    score,
    ratingChange,
    ratingAfter,
  })

  // Finalize session after the last round
  if (roundNumber === RANKED_ROUNDS) {
    const allResults = [...existingResults, { score, ratingAfter }]
    const totalScore = allResults.reduce((sum, r) => sum + r.score, 0)
    await completeRankedSession(sessionId, totalScore, ratingAfter)
    await updateUserRating(user.id, ratingAfter)
  }

  return { ratingChange, ratingAfter }
}
