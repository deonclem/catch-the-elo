import 'server-only'

import type { Tables } from '@/lib/database.types'
import { createClient } from '@/utils/supabase/server'

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

/** 'none' = no active streak, 'at_risk' = active but not played today, 'active' = played today */
export type StreakStatus = 'none' | 'at_risk' | 'active'

export function computeStreakStatus(profile: Profile | null): StreakStatus {
  if (!profile || !profile.streak_last_played) return 'none'
  if (profile.streak_last_played < utcDateString(-1)) return 'none'
  if (profile.streak_last_played === utcDateString()) return 'active'
  return 'at_risk'
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

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .is('deleted_at', null)
    .single()
  return data
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return data !== null
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
  avatarSlug: string | null
  streak: number
}

export type RatingLeaderboardEntry = {
  rank: number
  userId: string
  username: string | null
  avatarSlug: string | null
  rating: number
}

export async function getStreakLeaderboard(): Promise<
  StreakLeaderboardEntry[]
> {
  const supabase = await createClient()
  const yesterday = utcDateString(-1)
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_slug, current_streak')
    .gte('streak_last_played', yesterday)
    .gt('current_streak', 0)
    .is('deleted_at', null)
    .order('current_streak', { ascending: false })
    .limit(10)

  return (data ?? []).map((p, i) => ({
    rank: i + 1,
    userId: p.id,
    username: p.username,
    avatarSlug: p.avatar_slug,
    streak: p.current_streak,
  }))
}

export async function getRatingLeaderboard(): Promise<
  RatingLeaderboardEntry[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_slug, rating')
    .is('deleted_at', null)
    .order('rating', { ascending: false })
    .limit(10)

  return (data ?? []).map((p, i) => ({
    rank: i + 1,
    userId: p.id,
    username: p.username,
    avatarSlug: p.avatar_slug,
    rating: p.rating,
  }))
}

export async function getUserStreakLeaderboardEntry(
  userId: string
): Promise<StreakLeaderboardEntry | null> {
  const supabase = await createClient()
  const yesterday = utcDateString(-1)

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_slug, current_streak, streak_last_played')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (
    !profile ||
    !profile.streak_last_played ||
    profile.streak_last_played < yesterday ||
    profile.current_streak === 0
  )
    return null

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('streak_last_played', yesterday)
    .gt('current_streak', profile.current_streak)
    .is('deleted_at', null)

  return {
    rank: (count ?? 0) + 1,
    userId,
    username: profile.username,
    avatarSlug: profile.avatar_slug,
    streak: profile.current_streak,
  }
}

export async function getUserRatingLeaderboardEntry(
  userId: string
): Promise<RatingLeaderboardEntry | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_slug, rating')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (!profile) return null

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('rating', profile.rating)
    .is('deleted_at', null)

  return {
    rank: (count ?? 0) + 1,
    userId,
    username: profile.username,
    avatarSlug: profile.avatar_slug,
    rating: profile.rating,
  }
}

export async function updateUserRating(
  userId: string,
  newRating: number,
  totalScore?: number
): Promise<void> {
  const supabase = await createClient()

  if (totalScore !== undefined) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('highest_score')
      .eq('id', userId)
      .single()
    const newHighest = Math.max(profile?.highest_score ?? 0, totalScore)
    await supabase
      .from('profiles')
      .update({ rating: newRating, highest_score: newHighest })
      .eq('id', userId)
  } else {
    await supabase
      .from('profiles')
      .update({ rating: newRating })
      .eq('id', userId)
  }
}

export async function updateAvatarSlug(
  userId: string,
  slug: string
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('profiles').update({ avatar_slug: slug }).eq('id', userId)
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
