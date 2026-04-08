import { Navbar } from '@/components/layout/Navbar'
import {
  computeActiveStreak,
  computeStreakStatus,
  getProfileByUserId,
} from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Gueslo - Guess the Elo',
    template: '%s - Gueslo',
  },
  description:
    'Can you guess the Elo rating of a chess game? Play the daily challenge or ranked mode. The best Elo guesser game online.',
  keywords: [
    'guess the elo',
    'elo guesser',
    'elogussr',
    'chess elo game',
    'daily chess challenge',
    'chess rating game',
    'gueslo',
  ],
  metadataBase: new URL('https://gueslo.app'),
  openGraph: {
    type: 'website',
    siteName: 'Gueslo',
    title: 'Gueslo - Guess the Elo',
    description:
      'Can you guess the Elo rating of a chess game? Play the daily challenge or ranked mode.',
    url: 'https://gueslo.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gueslo - Guess the Elo',
    description:
      'Can you guess the Elo rating of a chess game? Play the daily challenge or ranked mode.',
  },
  alternates: { canonical: 'https://gueslo.app' },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = user ? await getProfileByUserId(user.id) : null
  const streak = computeActiveStreak(profile)
  const streakStatus = computeStreakStatus(profile)

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Navbar
          isLoggedIn={user !== null}
          streak={streak}
          streakStatus={streakStatus}
          avatarSlug={profile?.avatar_slug ?? null}
          username={profile?.username ?? null}
        />
        <div className="flex flex-1 flex-col pb-14 md:pt-16 md:pb-0">
          {children}
          <footer className="flex justify-center py-6 md:justify-end md:px-6">
            <Link
              href="/privacy"
              className="text-muted-foreground text-xs hover:underline"
            >
              Privacy Policy
            </Link>
          </footer>
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
