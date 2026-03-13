'use client'

import { useState } from 'react'
import type { ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'
import { ChessKnight } from 'lucide-react'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import type { DailyHistoryEntry } from '@/lib/dal/game_results'

type Props = {
  history: DailyHistoryEntry[]
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

export function ProfileCalendar({ history }: Props) {
  const today = new Date()
  const [month, setMonth] = useState(today)

  const playedDates = history.map((e) => {
    const [y, m, d] = e.date.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  return (
    <Calendar
      mode="single"
      selected={undefined}
      onSelect={() => {}}
      month={month}
      onMonthChange={setMonth}
      disabled={{ after: today }}
      modifiers={{ played: playedDates }}
      components={{ DayButton: PlayedDayButton }}
      showOutsideDays={false}
      className="mx-auto p-0"
      classNames={{
        month_caption: 'flex h-8 w-full items-center justify-center px-8 mb-1',
        caption_label:
          'text-xs font-semibold tracking-wide uppercase text-muted-foreground',
        button_previous:
          'absolute left-0 top-0 size-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors opacity-60 hover:opacity-100',
        button_next:
          'absolute right-0 top-0 size-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors opacity-60 hover:opacity-100',
        weekday:
          'flex-1 text-[0.65rem] font-normal text-muted-foreground/50 text-center select-none pb-1',
        day: 'group/day relative aspect-square h-full w-full p-0 text-center select-none',
        today: 'rounded-md bg-muted/60 text-foreground font-medium',
        disabled: 'text-muted-foreground/30 opacity-100',
        outside: 'invisible',
      }}
    />
  )
}
