import { ProfileContent } from '@/app/profile/_components/ProfileContent'
import { getUserDailyHistory } from '@/lib/dal/game_results'
import { computeActiveStreak, getProfileByUsername } from '@/lib/dal/profiles'
import { getPublicUserRankedSessionHistory } from '@/lib/dal/ranked_sessions'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return { title: 'Player not found' }
  return { title: `${profile.username} — Gueslo` }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const [history, rankedHistory] = await Promise.all([
    getUserDailyHistory(profile.id),
    getPublicUserRankedSessionHistory(profile.id),
  ])

  const activeStreak = computeActiveStreak(profile)

  return (
    <ProfileContent
      profile={profile}
      history={history}
      rankedHistory={rankedHistory}
      activeStreak={activeStreak}
    />
  )
}
