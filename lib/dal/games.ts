import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { Tables } from '@/lib/database.types'

export type DailyGame = Tables<'daily_games'>

export type RecentDailyGame = Pick<DailyGame, 'id' | 'scheduled_for'>

export async function getRecentDailyGames(
  n: number
): Promise<RecentDailyGame[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_games')
    .select('id, scheduled_for')
    .lte('scheduled_for', today)
    .is('deleted_at', null)
    .order('scheduled_for', { ascending: false })
    .limit(n)
  return data ?? []
}

export async function getDailyGame(): Promise<DailyGame | null> {
  const supabase = await createClient()
  // Use UTC date — ensures all players globally see the same game at midnight UTC
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_games')
    .select('*')
    .eq('scheduled_for', today)
    .is('deleted_at', null)
    .single()
  return data
}
