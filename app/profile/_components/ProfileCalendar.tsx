'use client'

import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import type { DailyHistoryEntry } from '@/lib/dal/game_results'
import type { StreakStatus } from '@/lib/dal/profiles'
import {
  Award,
  CalendarDays,
  ChessKnight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Snowflake,
} from 'lucide-react'
import type { ComponentProps } from 'react'
import { useState } from 'react'
import type { DayButton } from 'react-day-picker'

type Props = {
  history: DailyHistoryEntry[]
  activeStreak: number
  bestStreak: number
  streakStatus: StreakStatus
}

function PlayedDayButton({
  children,
  ...props
}: ComponentProps<typeof DayButton>) {
  return (
    <CalendarDayButton {...props}>
      {props.modifiers.played ? (
        <ChessKnight className="text-primary size-3.5" />
      ) : (
        children
      )}
    </CalendarDayButton>
  )
}

const FLAME_CLASS: Record<StreakStatus, string> = {
  active: 'text-orange-400',
  at_risk: 'text-sky-400',
  none: 'text-muted-foreground',
}

export function ProfileCalendar({
  history,
  activeStreak,
  bestStreak,
  streakStatus,
}: Props) {
  const today = new Date()
  const [month, setMonth] = useState(today)

  const playedDates = history.map((e) => {
    const [y, m, d] = e.date.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  const totalGames = history.length

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const canGoNext = nextMonth <= today

  const monthLabel = month.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const flameClass = FLAME_CLASS[streakStatus]

  return (
    <div className="bg-card border-border rounded-xl border p-4">
      {/* ── Header: nav + month ── */}
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          onClick={() => setMonth(prevMonth)}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="text-sm font-medium">{monthLabel}</span>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          onClick={() => setMonth(nextMonth)}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* ── Body ── */}
      {/* Desktop: calendar left + vertical stats right */}
      <div className="hidden items-stretch gap-3 md:flex">
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={() => {}}
          disabled={{ after: today }}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ played: playedDates }}
          components={{ DayButton: PlayedDayButton }}
          showOutsideDays={false}
          fixedWeeks
          ISOWeek
          className="pointer-events-none bg-transparent p-0"
          classNames={{
            nav: 'hidden',
            month_caption: 'hidden',
            weekday:
              'flex-1 text-[0.65rem] font-normal text-muted-foreground/50 text-center select-none pb-1',
            day: 'group/day relative aspect-square h-full w-full p-0 text-center select-none',
            today: 'rounded-md bg-muted/60 text-foreground font-medium',
            disabled: 'text-muted-foreground/30 opacity-100',
            outside: 'invisible',
          }}
        />
        <div className="border-border flex flex-1 flex-col justify-center gap-5 border-l pl-3">
          <div className="flex items-center gap-2.5">
            {streakStatus === 'at_risk' ? (
              <Snowflake className={`size-9 shrink-0 ${flameClass}`} />
            ) : (
              <Flame className={`size-9 shrink-0 ${flameClass}`} />
            )}
            <div>
              <p className="text-lg leading-none font-bold tabular-nums">
                {activeStreak}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Current streak
              </p>
            </div>
          </div>
          <div className="bg-border h-px w-full" />
          <div className="flex items-center gap-2.5">
            <Award className="text-muted-foreground size-9 shrink-0" />
            <div>
              <p className="text-lg leading-none font-bold tabular-nums">
                {bestStreak}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Best streak
              </p>
            </div>
          </div>
          <div className="bg-border h-px w-full" />
          <div className="flex items-center gap-2.5">
            <CalendarDays className="text-muted-foreground size-9 shrink-0" />
            <div>
              <p className="text-lg leading-none font-bold tabular-nums">
                {totalGames}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Days played
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: calendar full-width + 3-col stats below */}
      <div className="flex flex-col gap-4 md:hidden">
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={() => {}}
          disabled={{ after: today }}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ played: playedDates }}
          components={{ DayButton: PlayedDayButton }}
          showOutsideDays={false}
          fixedWeeks
          ISOWeek
          className="pointer-events-none w-full bg-transparent p-0"
          classNames={{
            nav: 'hidden',
            month_caption: 'hidden',
            month_grid: 'w-full',
            weekday:
              'flex-1 text-[0.65rem] font-normal text-muted-foreground/50 text-center select-none pb-1',
            day: 'group/day relative aspect-square h-full w-full p-0 text-center select-none',
            today: 'rounded-md bg-muted/60 text-foreground font-medium',
            disabled: 'text-muted-foreground/30 opacity-100',
            outside: 'invisible',
          }}
        />
        <div className="border-border grid grid-cols-3 divide-x border-t pt-4">
          <div className="flex flex-col items-center gap-1 px-2">
            {streakStatus === 'at_risk' ? (
              <Snowflake className={`size-5 ${flameClass}`} />
            ) : (
              <Flame className={`size-5 ${flameClass}`} />
            )}
            <p className="text-base font-bold tabular-nums">{activeStreak}</p>
            <p className="text-muted-foreground text-center text-[10px]">
              Streak
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <Award className="text-muted-foreground size-5" />
            <p className="text-base font-bold tabular-nums">{bestStreak}</p>
            <p className="text-muted-foreground text-center text-[10px]">
              Best
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <CalendarDays className="text-muted-foreground size-5" />
            <p className="text-base font-bold tabular-nums">{totalGames}</p>
            <p className="text-muted-foreground text-center text-[10px]">
              Played
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
