export function calculateAverageElo(
  whiteElo: number | null,
  blackElo: number | null
): number | null {
  if (whiteElo === null || blackElo === null) return null
  return Math.round((whiteElo + blackElo) / 2)
}

const SIGMA_K = 0.25
const SIGMA_MIN = 200

export function calculateScore(guess: number, actual: number): number {
  const sigma = Math.max(actual * SIGMA_K, SIGMA_MIN)
  const diff = Math.abs(guess - actual)
  return Math.round(5000 * Math.exp(-((diff / sigma) ** 2)))
}

export function generateShareText(
  guess: number,
  actual: number,
  score: number,
  speed: string
): string {
  const diff = Math.abs(guess - actual)
  const bar = Array.from({ length: 5 }, (_, i) =>
    score >= (i + 1) * 1000 ? '🟩' : '⬛'
  ).join('')
  const speedLabel = speed.charAt(0).toUpperCase() + speed.slice(1)
  return [
    `Catch The Elo 🎯`,
    `♟️ ${speedLabel} | Off by ${diff}`,
    `${bar} ${score.toLocaleString()}/5,000`,
  ].join('\n')
}
