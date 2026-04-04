import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { MoveNavigator } from './MoveNavigator'

type Props = {
  Icon: LucideIcon
  iconClass: string
  title: string
  children: ReactNode
  moveLabel: string
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
}

export function GuessCard({
  Icon,
  iconClass,
  title,
  children,
  moveLabel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: Props) {
  return (
    <div className="bg-card border-border w-full max-w-[280px] shrink-0 overflow-hidden rounded-xl border lg:w-[220px]">
      {/* Header */}
      <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
        <Icon className={`size-4 ${iconClass}`} />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>

      {/* Navigator footer */}
      <div className="border-border flex flex-col items-center gap-2 border-t px-4 py-3">
        <MoveNavigator
          moveLabel={moveLabel}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={onBack}
          onForward={onForward}
          compact
        />
        <p className="text-muted-foreground text-xs">← → arrow keys</p>
      </div>
    </div>
  )
}
