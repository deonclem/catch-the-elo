import { EloChart } from '@/app/profile/_components/EloChart'
import { ProfileCalendar } from '@/app/profile/_components/ProfileCalendar'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getUserDailyHistory } from '@/lib/dal/game_results'
import { computeActiveStreak, getProfileByUsername } from '@/lib/dal/profiles'
import { getUserRankedSessionHistory } from '@/lib/dal/ranked_sessions'
import { CalendarDays, Flame, Swords, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return { title: 'Player not found' }
  return { title: `${profile.username} — Catch the Elo` }
}

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

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const [history, rankedHistory] = await Promise.all([
    getUserDailyHistory(profile.id),
    getUserRankedSessionHistory(profile.id),
  ])

  const activeStreak = computeActiveStreak(profile)
  const totalGames = history.length

  return (
    <main className="flex flex-1 flex-col items-center p-4 pt-8 pb-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* ── 1. Profile ── */}
        <Section title="Profile">
          <div className="bg-card border-border flex items-center gap-4 rounded-xl border p-4">
            <UserAvatar slug={profile.avatar_slug} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{profile.username}</p>
              <p className="text-muted-foreground text-sm">
                Member since{' '}
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Section>

        {/* ── 2. Ranked ── */}
        <Section title="Ranked">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Swords className="size-5" />}
              value={profile.rating ?? 1200}
              label="Rating"
            />
            <StatCard
              icon={<Trophy className="size-5" />}
              value={profile.highest_score?.toLocaleString() ?? '—'}
              label="Best score"
            />
          </div>
          {rankedHistory.length > 0 && (
            <EloChart
              history={rankedHistory}
              profileCreatedAt={profile.created_at}
            />
          )}
        </Section>

        {/* ── 3. Daily ── */}
        <Section title="Daily">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Flame className="size-5" />}
              value={activeStreak}
              label="Current streak"
            />
            <StatCard
              icon={<Trophy className="size-5" />}
              value={profile.best_streak ?? 0}
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
      </div>
    </main>
  )
}
