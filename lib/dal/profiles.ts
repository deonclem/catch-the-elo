import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { Tables } from '@/lib/database.types'

export type Profile = Tables<'profiles'>

function utcDateString(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86400000)
    .toISOString()
    .split('T')[0]
}

export function computeActiveStreak(profile: Profile | null): number {
  if (!profile || !profile.streak_last_played) return 0
  return profile.streak_last_played >= utcDateString(-1)
    ? profile.current_streak
    : 0
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw error
  return data
}

export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertUsername(
  userId: string,
  username: string
): Promise<{ error: 'username_taken' | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId)

  if (error) {
    if (error.code === '23505') return { error: 'username_taken' }
    throw error
  }
  return { error: null }
}

export type StreakLeaderboardEntry = {
  rank: number
  userId: string
  username: string | null
  streak: number
}

export type RatingLeaderboardEntry = {
  rank: number
  userId: string
  username: string | null
  rating: number
}

export async function getStreakLeaderboard(): Promise<
  StreakLeaderboardEntry[]
> {
  const supabase = await createClient()
  const yesterday = utcDateString(-1)
  const { data } = await supabase
    .from('profiles')
    .select('id, username, current_streak')
    .gte('streak_last_played', yesterday)
    .gt('current_streak', 0)
    .is('deleted_at', null)
    .order('current_streak', { ascending: false })
    .limit(10)

  return (data ?? []).map((p, i) => ({
    rank: i + 1,
    userId: p.id,
    username: p.username,
    streak: p.current_streak,
  }))
}

export async function getRatingLeaderboard(): Promise<
  RatingLeaderboardEntry[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, rating')
    .is('deleted_at', null)
    .order('rating', { ascending: false })
    .limit(10)

  return (data ?? []).map((p, i) => ({
    rank: i + 1,
    userId: p.id,
    username: p.username,
    rating: p.rating,
  }))
}

export async function updateUserRating(
  userId: string,
  newRating: number
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('profiles').update({ rating: newRating }).eq('id', userId)
}

export async function updateStreak(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, best_streak, streak_last_played')
    .eq('id', userId)
    .single()

  if (!profile) return

  const yesterday = utcDateString(-1)
  const newStreak =
    profile.streak_last_played === yesterday ? profile.current_streak + 1 : 1
  const newBest = Math.max(profile.best_streak, newStreak)

  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      best_streak: newBest,
      streak_last_played: utcDateString(),
    })
    .eq('id', userId)
}
