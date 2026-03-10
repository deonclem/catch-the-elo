import { createClient } from '@/utils/supabase/server'
import type { Tables } from '@/lib/database.types'

export type Profile = Tables<'profiles'>

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw error
  return data
}
