'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  moveLabel: string
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  compact?: boolean
}

export function MoveNavigator({
  moveLabel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  compact = false,
}: Props) {
  return (
    <div
      className={`flex items-center ${compact ? 'w-full justify-between gap-2' : 'gap-4'}`}
    >
      <Button
        variant="outline"
        className={compact ? 'size-9' : 'size-11'}
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Previous move"
      >
        <ChevronLeft />
      </Button>
      <span
        className={`text-muted-foreground text-center text-sm ${compact ? 'min-w-[80px]' : 'min-w-[120px]'}`}
      >
        {moveLabel}
      </span>
      <Button
        variant="outline"
        className={compact ? 'size-9' : 'size-11'}
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Next move"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
