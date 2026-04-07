import type { Metadata } from 'next'
import { parseDailyGame } from '@/lib/chess/parser'

export const metadata: Metadata = {
  title: 'Ranked Mode',
  description:
    '5-round ranked sessions. Earn an Elo rating based on your Elo guesses.',
}
import { getRankedSessionResults } from '@/lib/dal/game_results'
import { getProfileByUserId } from '@/lib/dal/profiles'
import {
  getActiveRankedSession,
  getRankedSessionWithGames,
} from '@/lib/dal/ranked_sessions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { RankedGame } from './_components/RankedGame'
import { RankedLobby } from './_components/RankedLobby'

export default async function RankedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/ranked')

  const [profile, activeSession] = await Promise.all([
    getProfileByUserId(user.id),
    getActiveRankedSession(user.id),
  ])

  // No active session → show lobby
  if (!activeSession) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-12">
        <RankedLobby rating={profile?.rating ?? 1200} />
      </main>
    )
  }

  // Active session → fetch games + completed rounds
  const [sessionWithGames, completedRounds] = await Promise.all([
    getRankedSessionWithGames(activeSession.id),
    getRankedSessionResults(activeSession.id),
  ])

  if (!sessionWithGames) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Session not found.</p>
      </main>
    )
  }

  const parsedGames = sessionWithGames.games.map(parseDailyGame)

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-0 py-4 md:p-12">
      <RankedGame
        session={activeSession}
        games={parsedGames}
        completedRounds={completedRounds}
      />
    </main>
  )
}
