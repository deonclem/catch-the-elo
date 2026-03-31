import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { createClient } from '@/utils/supabase/server'
import { getProfileByUserId, computeActiveStreak } from '@/lib/dal/profiles'
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
  title: 'Catch The Elo',
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
      </body>
    </html>
  )
}
