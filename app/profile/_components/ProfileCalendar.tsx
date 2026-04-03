'use client'

import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import type { DailyHistoryEntry } from '@/lib/dal/game_results'
import {
  Award,
  CalendarDays,
  ChessKnight,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react'
import type { ComponentProps } from 'react'
import { useState } from 'react'
import type { DayButton } from 'react-day-picker'

type Props = {
  history: DailyHistoryEntry[]
  activeStreak: number
  bestStreak: number
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

export function ProfileCalendar({ history, activeStreak, bestStreak }: Props) {
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

  return (
    <div className="bg-card border-border rounded-xl border p-4">
      {/* ── Header: nav + month + streak ── */}
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

      {/* ── Body: calendar left + stats right ── */}
      <div className="flex items-stretch gap-3">
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

        {/* Stats column */}
        <div className="border-border flex flex-1 flex-col justify-center gap-5 border-l pl-3">
          <div className="flex items-center gap-2.5">
            <Flame className="size-9 shrink-0 text-orange-400" />
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
    </div>
  )
}
