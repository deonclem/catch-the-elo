'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Swords, Trophy, User, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Daily' },
  { href: '/ranked', label: 'Ranked' },
  { href: '/leaderboard', label: 'Leaderboard' },
] as const

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Daily', Icon: Zap },
  { href: '/ranked', label: 'Ranked', Icon: Swords },
  { href: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { href: '/profile', label: 'Profile', Icon: User },
] as const

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function Navbar({
  isLoggedIn,
  streak = 0,
  avatarSlug = null,
}: {
  isLoggedIn: boolean
  streak?: number
  avatarSlug?: string | null
}) {
  const pathname = usePathname()
  const profileHref = isLoggedIn ? '/profile' : '/auth'

  return (
    <>
      {/* Desktop: sticky top navbar with glassmorphism */}
      <header className="border-border/60 bg-background/80 fixed inset-x-0 top-0 z-50 hidden h-16 items-center border-b px-6 backdrop-blur-md md:flex">
        <div className="flex w-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-transparent">
                Catch
              </span>
              <span className="text-foreground"> The Elo</span>
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative py-1 text-sm font-medium transition-colors',
                  isActive(pathname, href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                {isActive(pathname, href) && (
                  <span className="bg-primary absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn && streak > 0 && (
              <div className="border-primary/30 bg-primary/10 text-primary flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold">
                <Flame className="size-3.5" />
                <span>{streak}</span>
              </div>
            )}
            {isLoggedIn && (
              <Link href="/profile" aria-label="My Profile">
                <UserAvatar slug={avatarSlug} size="sm" />
              </Link>
            )}
            <Button
              variant={isLoggedIn ? 'outline' : 'default'}
              size="sm"
              asChild
            >
              {isLoggedIn ? (
                <Link href="/profile">My Profile</Link>
              ) : (
                <Link href="/auth">Sign In</Link>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile: fixed bottom nav with glassmorphism */}
      <nav className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t backdrop-blur-md md:hidden">
        {MOBILE_NAV_ITEMS.map(({ href, label, Icon }) => {
          const resolvedHref = label === 'Profile' ? profileHref : href
          const active = isActive(pathname, resolvedHref)
          const isProfile = label === 'Profile'
          return (
            <Link
              key={href}
              href={resolvedHref}
              aria-label={label}
              className="relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              {active && (
                <span
                  className="bg-primary absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-b-full"
                  aria-hidden="true"
                />
              )}
              {isProfile && isLoggedIn ? (
                <span
                  className={cn(
                    'rounded-full transition-opacity',
                    active ? 'ring-primary ring-1 ring-offset-1' : ''
                  )}
                >
                  <UserAvatar slug={avatarSlug} size="sm" />
                </span>
              ) : (
                <Icon
                  className={cn(
                    'size-5 transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              )}
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
