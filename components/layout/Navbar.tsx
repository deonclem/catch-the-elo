'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Swords, Trophy, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const profileHref = isLoggedIn ? '/profile' : '/auth'

  return (
    <>
      {/* Desktop: sticky top navbar */}
      <header className="bg-background fixed inset-x-0 top-0 z-50 hidden h-16 items-center border-b px-6 md:flex">
        <div className="flex w-full items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            CatchTheElo
          </Link>

          <nav className="flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'hover:text-primary text-sm font-medium transition-colors',
                  isActive(pathname, href)
                    ? 'border-primary text-primary border-b-2'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Button variant="outline" size="sm" asChild>
            {isLoggedIn ? (
              <Link href="/profile">My Profile</Link>
            ) : (
              <Link href="/auth">Sign In</Link>
            )}
          </Button>
        </div>
      </header>

      {/* Mobile: fixed bottom nav */}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-14 items-center border-t md:hidden">
        {MOBILE_NAV_ITEMS.map(({ href, label, Icon }) => {
          const resolvedHref = label === 'Profile' ? profileHref : href
          const active = isActive(pathname, resolvedHref)
          return (
            <Link
              key={href}
              href={resolvedHref}
              aria-label={label}
              className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2"
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {active && (
                <span
                  className="bg-primary size-1 rounded-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
