import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { Tables } from '@/lib/database.types'

export type Profile = Tables<'profiles'>

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
