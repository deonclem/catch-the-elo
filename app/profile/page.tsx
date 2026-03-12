import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getProfileByUserId, computeActiveStreak } from '@/lib/dal/profiles'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const profile = await getProfileByUserId(user.id)
  const activeStreak = computeActiveStreak(profile)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="border-border bg-card flex w-full max-w-sm flex-col gap-6 rounded-xl border p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            {profile?.username ?? 'Anonymous'}
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">🔥 {activeStreak}</p>
            <p className="text-muted-foreground mt-1 text-xs">Current streak</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">🏆 {profile?.best_streak ?? 0}</p>
            <p className="text-muted-foreground mt-1 text-xs">Best streak</p>
          </div>
        </div>

        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  )
}
