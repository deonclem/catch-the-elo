'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { AVAILABLE_AVATARS } from '@/lib/avatars'
import { updateAvatarSlug } from '@/lib/dal/profiles'

export async function updateAvatar(slug: string): Promise<void> {
  if (!(AVAILABLE_AVATARS as readonly string[]).includes(slug)) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await updateAvatarSlug(user.id, slug)
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  await createAdminClient().auth.admin.deleteUser(user.id)
  await supabase.auth.signOut()
  redirect('/')
}
