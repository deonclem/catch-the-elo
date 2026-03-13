import { Clock } from 'lucide-react'

type Props = {
  timeControl: string
}

export function GameInfoCard({ timeControl }: Props) {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <Clock className="size-4" />
      <span>{timeControl}</span>
    </div>
  )
}
