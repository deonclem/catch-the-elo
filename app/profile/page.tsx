import { ProfileContent } from './_components/ProfileContent'
import { getUserDailyHistory } from '@/lib/dal/game_results'
import {
  computeActiveStreak,
  computeStreakStatus,
  getProfileByUserId,
} from '@/lib/dal/profiles'
import { getUserRankedSessionHistory } from '@/lib/dal/ranked_sessions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/profile')

  const [profile, history, rankedHistory] = await Promise.all([
    getProfileByUserId(user.id),
    getUserDailyHistory(user.id),
    getUserRankedSessionHistory(user.id),
  ])

  if (!profile) redirect('/auth?next=/profile')

  const activeStreak = computeActiveStreak(profile)
  const streakStatus = computeStreakStatus(profile)

  return (
    <ProfileContent
      profile={profile}
      history={history}
      rankedHistory={rankedHistory}
      activeStreak={activeStreak}
      streakStatus={streakStatus}
      email={user.email}
    />
  )
}
