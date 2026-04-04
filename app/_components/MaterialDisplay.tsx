import { getMaterial } from '@/lib/chess/material'
import type { LucideIcon } from 'lucide-react'
import {
  ChessBishop,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
} from 'lucide-react'

type PieceKey = 'q' | 'r' | 'b' | 'n' | 'p'

const PIECE_ICONS: Record<PieceKey, LucideIcon> = {
  q: ChessQueen,
  r: ChessRook,
  b: ChessBishop,
  n: ChessKnight,
  p: ChessPawn,
}

// Most to least valuable
const PIECE_ORDER: PieceKey[] = ['q', 'r', 'b', 'n', 'p']

type Props = {
  color: 'white' | 'black'
  fen: string
}

export function MaterialDisplay({ color, fen }: Props) {
  const { whiteCaptured, blackCaptured, materialDiff } = getMaterial(fen)

  const captured = color === 'white' ? whiteCaptured : blackCaptured
  const isAhead = color === 'white' ? materialDiff > 0 : materialDiff < 0
  const advantage = Math.abs(materialDiff)

  const groups = PIECE_ORDER.map((p) => ({
    piece: p,
    count: captured[p],
  })).filter(({ count }) => count > 0)

  if (groups.length === 0 && !isAhead) return null

  return (
    <div className="flex items-center gap-1">
      {groups.map(({ piece, count }) => {
        const Icon = PIECE_ICONS[piece]
        return (
          <div key={piece} className="flex items-center">
            {Array.from({ length: count }).map((_, i) => (
              <Icon
                key={i}
                className="text-primary size-3.5"
                style={i > 0 ? { marginLeft: '-6px' } : undefined}
              />
            ))}
          </div>
        )
      })}
      {isAhead && advantage > 0 && (
        <span className="text-muted-foreground text-[10px] font-medium">
          +{advantage}
        </span>
      )}
    </div>
  )
}
