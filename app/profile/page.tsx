import { ProfileCalendar } from './_components/ProfileCalendar'
import { DeleteAccountDialog } from './_components/DeleteAccountDialog'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import { getUserDailyHistory } from '@/lib/dal/game_results'
import { computeActiveStreak, getProfileByUserId } from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import { CalendarDays, Flame, ImageIcon, Swords, Trophy } from 'lucide-react'
import { redirect } from 'next/navigation'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="bg-card border-border flex flex-col items-center gap-1.5 rounded-xl border p-4">
      <div className="text-primary">{icon}</div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const [profile, history] = await Promise.all([
    getProfileByUserId(user.id),
    getUserDailyHistory(user.id),
  ])

  const activeStreak = computeActiveStreak(profile)
  const totalGames = history.length

  return (
    <main className="flex flex-1 flex-col items-center p-4 pt-8 pb-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* ── 1. Profile ── */}
        <Section title="Profile">
          <div className="bg-card border-border flex items-center gap-4 rounded-xl border p-4">
            {/* Avatar placeholder */}
            <div className="bg-muted border-border flex size-14 shrink-0 items-center justify-center rounded-full border">
              <ImageIcon className="text-muted-foreground size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {profile?.username ?? 'Anonymous'}
              </p>
              <p className="text-muted-foreground truncate text-sm">
                {user.email}
              </p>
            </div>
            <span className="text-muted-foreground border-border rounded-md border px-2 py-1 text-xs">
              Soon
            </span>
          </div>
        </Section>

        {/* ── 2. Ranked ── */}
        <Section title="Ranked">
          <div className="bg-card border-border flex flex-col items-center gap-2 rounded-xl border p-6 text-center">
            <Swords className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">Ranked mode coming soon</p>
            <p className="text-muted-foreground text-xs">
              Your Elo rating and match history will appear here.
            </p>
          </div>
        </Section>

        {/* ── 3. Daily ── */}
        <Section title="Daily">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Flame className="size-5" />}
              value={activeStreak}
              label="Current Streak"
            />
            <StatCard
              icon={<Trophy className="size-5" />}
              value={profile?.best_streak ?? 0}
              label="Best streak"
            />
            <StatCard
              icon={<CalendarDays className="size-5" />}
              value={totalGames}
              label="Games played"
            />
          </div>
          <ProfileCalendar history={history} />
        </Section>

        {/* ── 4. Account ── */}
        <Section title="Account">
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
          <DeleteAccountDialog />
        </Section>
      </div>
    </main>
  )
}
