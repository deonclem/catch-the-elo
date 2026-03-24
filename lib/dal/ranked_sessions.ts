import 'server-only'

import { createClient } from '@/utils/supabase/server'
import { getRandomGames } from '@/lib/dal/games'
import type { Tables } from '@/lib/database.types'

export type RankedSession = {
  id: string
  userId: string
  status: 'active' | 'completed' | 'abandoned'
  totalScore: number | null
  ratingBefore: number
  ratingAfter: number | null
  startedAt: string
  completedAt: string | null
}

export type RankedSessionWithGames = RankedSession & {
  games: Tables<'games'>[]
}

export async function createRankedSession(
  userId: string,
  ratingBefore: number
): Promise<RankedSessionWithGames | null> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('ranked_sessions')
    .insert({ user_id: userId, rating_before: ratingBefore })
    .select(
      'id, user_id, status, total_score, rating_before, rating_after, started_at, completed_at'
    )
    .single()

  if (error || !session) return null

  const games = await getRandomGames(5)

  return {
    id: session.id,
    userId: session.user_id,
    status: session.status as RankedSession['status'],
    totalScore: session.total_score,
    ratingBefore: session.rating_before,
    ratingAfter: session.rating_after,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    games,
  }
}

export async function getRankedSession(
  sessionId: string
): Promise<RankedSession | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ranked_sessions')
    .select(
      'id, user_id, status, total_score, rating_before, rating_after, started_at, completed_at'
    )
    .eq('id', sessionId)
    .is('deleted_at', null)
    .single()

  if (!data) return null
  return {
    id: data.id,
    userId: data.user_id,
    status: data.status as RankedSession['status'],
    totalScore: data.total_score,
    ratingBefore: data.rating_before,
    ratingAfter: data.rating_after,
    startedAt: data.started_at,
    completedAt: data.completed_at,
  }
}

export async function completeRankedSession(
  sessionId: string,
  totalScore: number,
  ratingAfter: number
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('ranked_sessions')
    .update({
      status: 'completed',
      total_score: totalScore,
      rating_after: ratingAfter,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
}
