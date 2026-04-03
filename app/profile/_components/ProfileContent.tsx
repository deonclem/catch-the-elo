import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { signOut } from '@/lib/actions/auth'
import { RANKED_ROUNDS } from '@/lib/chess/scoring'
import type { DailyHistoryEntry } from '@/lib/dal/game_results'
import type { Profile } from '@/lib/dal/profiles'
import type { RankedSessionHistoryEntry } from '@/lib/dal/ranked_sessions'
import { Hash, Swords, Trophy } from 'lucide-react'
import { AvatarPickerDialog } from './AvatarPickerDialog'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { EloChart } from './EloChart'
import { ProfileCalendar } from './ProfileCalendar'

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

type Props = {
  profile: Profile
  history: DailyHistoryEntry[]
  rankedHistory: RankedSessionHistoryEntry[]
  activeStreak: number
  /** Present only for the authenticated owner — triggers editable avatar, email display, and account section. */
  email?: string
}

export function ProfileContent({
  profile,
  history,
  rankedHistory,
  activeStreak,
  email,
}: Props) {
  const isOwner = email !== undefined

  return (
    <main className="flex flex-1 flex-col items-center p-4 pt-8 pb-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* ── 1. Profile ── */}
        <Section title="Profile">
          <div className="bg-card border-border flex items-center gap-4 rounded-xl border p-4">
            {isOwner ? (
              <AvatarPickerDialog currentSlug={profile.avatar_slug ?? null} />
            ) : (
              <UserAvatar slug={profile.avatar_slug} size="lg" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {profile.username ?? 'Anonymous'}
              </p>
              {isOwner && (
                <p className="text-muted-foreground truncate text-sm">
                  {email}
                </p>
              )}
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
          <div className="grid grid-cols-3 gap-3">
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
            <StatCard
              icon={<Hash className="size-5" />}
              value={rankedHistory.length * RANKED_ROUNDS}
              label="Rounds played"
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
          <ProfileCalendar
            history={history}
            activeStreak={activeStreak}
            bestStreak={profile.best_streak ?? 0}
          />
        </Section>

        {/* ── 4. Account (owner only) ── */}
        {isOwner && (
          <Section title="Account">
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full">
                Sign out
              </Button>
            </form>
            <DeleteAccountDialog />
          </Section>
        )}
      </div>
    </main>
  )
}
