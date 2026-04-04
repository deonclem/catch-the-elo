type PieceCounts = {
  q: number
  r: number
  b: number
  n: number
  p: number
}

const STARTING: PieceCounts = { q: 1, r: 2, b: 2, n: 2, p: 8 }
const VALUES: PieceCounts = { q: 9, r: 5, b: 3, n: 3, p: 1 }

function materialSum(counts: PieceCounts): number {
  return (
    counts.q * VALUES.q +
    counts.r * VALUES.r +
    counts.b * VALUES.b +
    counts.n * VALUES.n +
    counts.p * VALUES.p
  )
}

export type MaterialState = {
  // Pieces each player has captured from the opponent
  whiteCaptured: PieceCounts
  blackCaptured: PieceCounts
  // Positive = white ahead, negative = black ahead, 0 = equal
  materialDiff: number
}

export function getMaterial(fen: string): MaterialState {
  const placement = fen.split(' ')[0]!

  const white: PieceCounts = { q: 0, r: 0, b: 0, n: 0, p: 0 }
  const black: PieceCounts = { q: 0, r: 0, b: 0, n: 0, p: 0 }

  for (const ch of placement) {
    switch (ch) {
      case 'Q':
        white.q++
        break
      case 'R':
        white.r++
        break
      case 'B':
        white.b++
        break
      case 'N':
        white.n++
        break
      case 'P':
        white.p++
        break
      case 'q':
        black.q++
        break
      case 'r':
        black.r++
        break
      case 'b':
        black.b++
        break
      case 'n':
        black.n++
        break
      case 'p':
        black.p++
        break
    }
  }

  const whiteCaptured: PieceCounts = {
    q: STARTING.q - black.q,
    r: STARTING.r - black.r,
    b: STARTING.b - black.b,
    n: STARTING.n - black.n,
    p: STARTING.p - black.p,
  }

  const blackCaptured: PieceCounts = {
    q: STARTING.q - white.q,
    r: STARTING.r - white.r,
    b: STARTING.b - white.b,
    n: STARTING.n - white.n,
    p: STARTING.p - white.p,
  }

  return {
    whiteCaptured,
    blackCaptured,
    materialDiff: materialSum(white) - materialSum(black),
  }
}
