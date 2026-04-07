import { Button } from '@/components/ui/button'
import { getDailyGameResultForUser } from '@/lib/dal/game_results'
import { getDailyGame } from '@/lib/dal/games'
import { getProfileByUserId } from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import { CheckCircle2, Flame, Swords, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Welcome',
}

export default async function WelcomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const [profile, dailyGame] = await Promise.all([
    getProfileByUserId(user.id),
    getDailyGame(),
  ])

  const username = profile?.username ?? 'there'

  const dailyResult =
    dailyGame
      ? await getDailyGameResultForUser(user.id, dailyGame.id)
      : null
  const hasPlayedToday = dailyResult !== null

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="Gueslo"
              width={36}
              height={36}
              className="rounded-sm"
            />
            <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Gueslo
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {username}!
          </h1>
          <p className="text-muted-foreground text-sm">
            {hasPlayedToday
              ? "Your score was saved — you're on the board!"
              : "You're all set. Here's what you can do:"}
          </p>
        </div>

        {hasPlayedToday ? (
          <>
            <div className="border-border bg-muted/30 rounded-xl border p-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-primary size-4 shrink-0" />
                  <span className="text-sm">
                    Today&apos;s daily game — done ✓
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Swords className="text-primary size-4 shrink-0" />
                  <span className="text-sm">
                    Earn an Elo rating in ranked mode
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Trophy className="text-primary size-4 shrink-0" />
                  <span className="text-sm">Climb the leaderboard</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link href="/ranked">Try Ranked Mode →</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/">See today&apos;s result</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="border-border bg-muted/30 rounded-xl border p-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Flame className="text-primary size-4 shrink-0" />
                  <span className="text-sm">Keep your daily streak going</span>
                </li>
                <li className="flex items-center gap-3">
                  <Trophy className="text-primary size-4 shrink-0" />
                  <span className="text-sm">Climb the leaderboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Swords className="text-primary size-4 shrink-0" />
                  <span className="text-sm">
                    Earn an Elo rating in ranked mode
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link href="/">Play Today&apos;s Challenge →</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/ranked">Try Ranked Mode →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
