import { getProfileByUserId, isUsernameTaken } from '@/lib/dal/profiles'
import { generateUsername } from '@/lib/username-generator'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UsernameForm } from './_components/UsernameForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const profile = await getProfileByUserId(user.id)
  if (profile?.onboarded_at) redirect('/')

  let defaultUsername = generateUsername()
  for (let i = 0; i < 5; i++) {
    if (!(await isUsernameTaken(defaultUsername))) break
    defaultUsername = generateUsername()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Almost there - pick your username
          </h1>
          <p className="text-muted-foreground text-sm">
            You can&apos;t change this later, so choose wisely.
          </p>
        </div>
        <UsernameForm defaultUsername={defaultUsername} />
      </div>
    </main>
  )
}
