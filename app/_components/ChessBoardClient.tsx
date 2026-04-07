'use client'

import { boardColors } from '@/lib/theme'
import { Chessboard } from 'react-chessboard'

type Props = {
  fen: string
}

// Safe to read window here — this module is never SSR'd (imported via dynamic with ssr:false)
const boardWidth = Math.min(window.innerWidth * 0.85, 504)

export function ChessBoardClient({ fen }: Props) {
  return (
    <div className="chess-board-wrapper">
      <Chessboard
        options={{
          position: fen,
          allowDragging: false,
          boardStyle: {
            width: boardWidth,
            height: boardWidth,
            borderRadius: '12px',
            boxShadow:
              '0 8px 32px oklch(0.56 0.26 290 / 0.18), 0 2px 8px oklch(0 0 0 / 0.08)',
          },
          lightSquareStyle: { backgroundColor: boardColors.light },
          darkSquareStyle: { backgroundColor: boardColors.dark },
        }}
      />
    </div>
  )
}
