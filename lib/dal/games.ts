import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { Tables } from '@/lib/database.types'

export type DailyGame = Tables<'games'> & {
  scheduled_for: string
}

export type RecentDailyGame = {
  id: string
  scheduled_for: string
}

export async function getRecentDailyGames(
  n: number
): Promise<RecentDailyGame[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_schedule')
    .select('scheduled_for, games!inner(id)')
    .lte('scheduled_for', today)
    .is('deleted_at', null)
    .order('scheduled_for', { ascending: false })
    .limit(n)
  return (data ?? []).map((row) => ({
    id: (row.games as { id: string }).id,
    scheduled_for: row.scheduled_for,
  }))
}

export async function getDailyGame(): Promise<DailyGame | null> {
  const supabase = await createClient()
  // Use UTC date — ensures all players globally see the same game at midnight UTC
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_schedule')
    .select('scheduled_for, games!inner(*)')
    .eq('scheduled_for', today)
    .is('deleted_at', null)
    .single()
  if (!data) return null
  return {
    ...(data.games as Tables<'games'>),
    scheduled_for: data.scheduled_for,
  }
}

export async function getDailyGameByDate(
  date: string
): Promise<DailyGame | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_schedule')
    .select('scheduled_for, games!inner(*)')
    .eq('scheduled_for', date)
    .is('deleted_at', null)
    .single()
  if (!data) return null
  return {
    ...(data.games as Tables<'games'>),
    scheduled_for: data.scheduled_for,
  }
}

export async function getRandomGames(n: number): Promise<Tables<'games'>[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_random_games', { n })
  return data ?? []
}
