import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { UsernameForm } from './_components/UsernameForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Choose a username
          </h1>
          <p className="text-muted-foreground text-sm">
            Pick a unique username to start playing ranked games.
          </p>
        </div>
        <UsernameForm />
      </div>
    </main>
  )
}
