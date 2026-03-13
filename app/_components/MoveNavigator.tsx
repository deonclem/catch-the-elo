'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  moveLabel: string
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
}

export function MoveNavigator({
  moveLabel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: Props) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        className="size-11"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Previous move"
      >
        <ChevronLeft />
      </Button>
      <span className="text-muted-foreground min-w-[120px] text-center text-sm">
        {moveLabel}
      </span>
      <Button
        variant="outline"
        className="size-11"
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Next move"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
