import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { createClient } from '@/utils/supabase/server'
import { getProfileByUserId, computeActiveStreak } from '@/lib/dal/profiles'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar isLoggedIn={user !== null} streak={streak} />
        <div className="pb-14 md:pt-16 md:pb-0">{children}</div>
      </body>
    </html>
  )
}
