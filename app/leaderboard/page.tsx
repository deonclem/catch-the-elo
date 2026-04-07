import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  getDailyLeaderboard,
  getUserDailyLeaderboardEntry,
  type LeaderboardEntry,
} from '@/lib/dal/game_results'
import { getDailyGame } from '@/lib/dal/games'
import {
  getRatingLeaderboard,
  getStreakLeaderboard,
  getUserRatingLeaderboardEntry,
  getUserStreakLeaderboardEntry,
  type RatingLeaderboardEntry,
  type StreakLeaderboardEntry,
} from '@/lib/dal/profiles'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/server'
import { Flame, Swords, Target } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Leaderboard',
  description:
    'Top Elo guessers worldwide. See the daily and all-time rankings.',
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="bg-primary/20 text-primary inline-flex size-6 items-center justify-center rounded-full text-xs font-bold">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="bg-muted text-muted-foreground inline-flex size-6 items-center justify-center rounded-full text-xs font-bold">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="bg-muted inline-flex size-6 items-center justify-center rounded-full text-xs font-bold text-[oklch(0.65_0.10_50)]">
        3
      </span>
    )
  return (
    <span className="text-muted-foreground text-xs tabular-nums">{rank}</span>
  )
}

function Panel({
  title,
  icon,
  empty,
  pinnedRow,
  children,
}: {
  title: string
  icon: React.ReactNode
  empty: boolean
  pinnedRow?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/40 flex items-center gap-2 border-b px-4 py-3">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {empty ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          No entries yet
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-border divide-y">{children}</tbody>
          {pinnedRow && (
            <tbody>
              <tr>
                <td
                  colSpan={3}
                  className="text-muted-foreground border-border border-t px-4 py-1 text-center text-xs"
                >
                  ···
                </td>
              </tr>
              {pinnedRow}
            </tbody>
          )}
        </table>
      )}
    </div>
  )
}

function DailyRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}) {
  return (
    <tr
      className={cn(
        isCurrentUser
          ? 'bg-primary/10 font-semibold'
          : 'hover:bg-muted/50 transition-colors'
      )}
    >
      <td className="py-2.5 pr-2 pl-4 text-center">
        <RankBadge rank={entry.rank} />
      </td>
      <td className="w-full max-w-0 py-2.5 pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar slug={entry.avatarSlug} size="sm" />
          {entry.username ? (
            <Link
              href={isCurrentUser ? '/profile' : `/profile/${entry.username}`}
              className="truncate hover:underline"
            >
              {entry.username}
              {isCurrentUser && (
                <span className="text-primary ml-1 text-xs font-normal">
                  (you)
                </span>
              )}
            </Link>
          ) : (
            <span className="truncate">Anonymous</span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {entry.score.toLocaleString()}
      </td>
    </tr>
  )
}

function StreakRow({
  entry,
  isCurrentUser,
}: {
  entry: StreakLeaderboardEntry
  isCurrentUser: boolean
}) {
  return (
    <tr
      className={cn(
        isCurrentUser
          ? 'bg-primary/10 font-semibold'
          : 'hover:bg-muted/50 transition-colors'
      )}
    >
      <td className="py-2.5 pr-2 pl-4 text-center">
        <RankBadge rank={entry.rank} />
      </td>
      <td className="w-full max-w-0 py-2.5 pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar slug={entry.avatarSlug} size="sm" />
          {entry.username ? (
            <Link
              href={isCurrentUser ? '/profile' : `/profile/${entry.username}`}
              className="truncate hover:underline"
            >
              {entry.username}
              {isCurrentUser && (
                <span className="text-primary ml-1 text-xs font-normal">
                  (you)
                </span>
              )}
            </Link>
          ) : (
            <span className="truncate">Anonymous</span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        <span className="flex items-center justify-end gap-1">
          <Flame className="text-primary size-3.5" />
          {entry.streak}
        </span>
      </td>
    </tr>
  )
}

function RatingRow({
  entry,
  isCurrentUser,
}: {
  entry: RatingLeaderboardEntry
  isCurrentUser: boolean
}) {
  return (
    <tr
      className={cn(
        isCurrentUser
          ? 'bg-primary/10 font-semibold'
          : 'hover:bg-muted/50 transition-colors'
      )}
    >
      <td className="py-2.5 pr-2 pl-4 text-center">
        <RankBadge rank={entry.rank} />
      </td>
      <td className="w-full max-w-0 py-2.5 pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar slug={entry.avatarSlug} size="sm" />
          {entry.username ? (
            <Link
              href={isCurrentUser ? '/profile' : `/profile/${entry.username}`}
              className="truncate hover:underline"
            >
              {entry.username}
              {isCurrentUser && (
                <span className="text-primary ml-1 text-xs font-normal">
                  (you)
                </span>
              )}
            </Link>
          ) : (
            <span className="truncate">Anonymous</span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">{entry.rating}</td>
    </tr>
  )
}

export default async function LeaderboardPage() {
  const [dailyGame, supabase] = await Promise.all([
    getDailyGame(),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    dailyEntries,
    streakEntries,
    ratingEntries,
    userDailyEntry,
    userStreakEntry,
    userRatingEntry,
  ] = await Promise.all([
    dailyGame ? getDailyLeaderboard(dailyGame.id) : Promise.resolve([]),
    getStreakLeaderboard(),
    getRatingLeaderboard(),
    dailyGame && user
      ? getUserDailyLeaderboardEntry(dailyGame.id, user.id)
      : Promise.resolve(null),
    user ? getUserStreakLeaderboardEntry(user.id) : Promise.resolve(null),
    user ? getUserRatingLeaderboardEntry(user.id) : Promise.resolve(null),
  ])

  const dailyPinned =
    userDailyEntry && !dailyEntries.some((e) => e.userId === user?.id)
  const streakPinned =
    userStreakEntry && !streakEntries.some((e) => e.userId === user?.id)
  const ratingPinned =
    userRatingEntry && !ratingEntries.some((e) => e.userId === user?.id)

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-4 pb-24 md:pb-8">
      <div className="w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-transparent">
            Leader
          </span>
          board
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{today}</p>
      </div>

      <div className="mx-auto grid w-full max-w-[980px] grid-cols-1 gap-4 md:grid-cols-3">
        <Panel
          title="Today's Best"
          icon={<Target className="size-4" />}
          empty={dailyEntries.length === 0}
          pinnedRow={
            dailyPinned ? (
              <DailyRow entry={userDailyEntry!} isCurrentUser />
            ) : undefined
          }
        >
          {dailyEntries.map((entry) => (
            <DailyRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === user?.id}
            />
          ))}
        </Panel>

        <Panel
          title="Top Active Streaks"
          icon={<Flame className="size-4" />}
          empty={streakEntries.length === 0}
          pinnedRow={
            streakPinned ? (
              <StreakRow entry={userStreakEntry!} isCurrentUser />
            ) : undefined
          }
        >
          {streakEntries.map((entry) => (
            <StreakRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === user?.id}
            />
          ))}
        </Panel>

        <Panel
          title="Top Ratings"
          icon={<Swords className="size-4" />}
          empty={ratingEntries.length === 0}
          pinnedRow={
            ratingPinned ? (
              <RatingRow entry={userRatingEntry!} isCurrentUser />
            ) : undefined
          }
        >
          {ratingEntries.map((entry) => (
            <RatingRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === user?.id}
            />
          ))}
        </Panel>
      </div>
    </main>
  )
}
