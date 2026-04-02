import { Navbar } from '@/components/layout/Navbar'
import { computeActiveStreak, getProfileByUserId } from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
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
  title: 'Gueslo',
  description: 'Guess the average Elo rating of a chess match.',
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

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Navbar
          isLoggedIn={user !== null}
          streak={streak}
          avatarSlug={profile?.avatar_slug ?? null}
        />
        <div className="flex flex-1 flex-col pb-14 md:pt-16 md:pb-0">
          {children}
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
