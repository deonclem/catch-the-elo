import { createClient } from '@/utils/supabase/server'
import { getDailyGame } from '@/lib/dal/games'
import {
  getDailyLeaderboard,
  type LeaderboardEntry,
} from '@/lib/dal/game_results'
import {
  getStreakLeaderboard,
  getRatingLeaderboard,
  type StreakLeaderboardEntry,
  type RatingLeaderboardEntry,
} from '@/lib/dal/profiles'

const MEDALS = ['🥇', '🥈', '🥉']

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) return <span>{MEDALS[rank - 1]}</span>
  return <span className="text-muted-foreground tabular-nums">{rank}</span>
}

function Panel({
  title,
  icon,
  empty,
  children,
}: {
  title: string
  icon: string
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="border-border flex flex-col overflow-hidden rounded-xl border">
      <div className="bg-muted/50 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">
          {icon} {title}
        </h2>
      </div>
      {empty ? (
        <p className="text-muted-foreground px-4 py-6 text-center text-sm">
          No entries yet
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y">{children}</tbody>
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
  const offBy = Math.abs(entry.guessElo - entry.actualElo)
  return (
    <tr
      className={
        isCurrentUser
          ? 'bg-primary/10 font-semibold'
          : 'hover:bg-muted/50 transition-colors'
      }
    >
      <td className="py-2.5 pr-2 pl-4 text-center text-xs">
        <RankCell rank={entry.rank} />
      </td>
      <td className="py-2.5 pr-2">
        {entry.username ?? 'Anonymous'}
        {isCurrentUser && (
          <span className="text-primary ml-1 text-xs font-normal">(you)</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {entry.score.toLocaleString()}
        <span className="text-muted-foreground ml-1 text-xs">−{offBy}</span>
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
      className={
        isCurrentUser
          ? 'bg-primary/10 font-semibold'
          : 'hover:bg-muted/50 transition-colors'
      }
    >
      <td className="py-2.5 pr-2 pl-4 text-center text-xs">
        <RankCell rank={entry.rank} />
      </td>
      <td className="py-2.5 pr-2">
        {entry.username ?? 'Anonymous'}
        {isCurrentUser && (
          <span className="text-primary ml-1 text-xs font-normal">(you)</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">🔥 {entry.streak}</td>
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
      className={
        isCurrentUser
          ? 'bg-primary/10 font-semibold'
          : 'hover:bg-muted/50 transition-colors'
      }
    >
      <td className="py-2.5 pr-2 pl-4 text-center text-xs">
        <RankCell rank={entry.rank} />
      </td>
      <td className="py-2.5 pr-2">
        {entry.username ?? 'Anonymous'}
        {isCurrentUser && (
          <span className="text-primary ml-1 text-xs font-normal">(you)</span>
        )}
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

  const [dailyEntries, streakEntries, ratingEntries] = await Promise.all([
    dailyGame ? getDailyLeaderboard(dailyGame.id) : Promise.resolve([]),
    getStreakLeaderboard(),
    getRatingLeaderboard(),
  ])

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-4 pb-20 md:pb-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel title="Today's Best" icon="🎯" empty={dailyEntries.length === 0}>
          {dailyEntries.map((entry) => (
            <DailyRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === user?.id}
            />
          ))}
        </Panel>

        <Panel title="Top Streaks" icon="🔥" empty={streakEntries.length === 0}>
          {streakEntries.map((entry) => (
            <StreakRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === user?.id}
            />
          ))}
        </Panel>

        <Panel title="Top Ratings" icon="⚔️" empty={ratingEntries.length === 0}>
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
