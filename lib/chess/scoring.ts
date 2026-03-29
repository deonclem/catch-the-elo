export const RANKED_ROUNDS = 5

export function calculateAverageElo(
  whiteElo: number | null,
  blackElo: number | null
): number | null {
  if (whiteElo === null || blackElo === null) return null
  return Math.round((whiteElo + blackElo) / 2)
}

const GRACE = 20 // within 20 pts = perfect score
const SIGMA = 400 // controls how fast score decays beyond grace zone

export function calculateScore(guess: number, actual: number): number {
  const diff = Math.max(0, Math.abs(guess - actual) - GRACE)
  return Math.round(5000 * Math.exp(-((diff / SIGMA) ** 2)))
}

const GAME_RATING = 1500
const K_FACTOR = 32

export function calculateRatingChange(
  playerRating: number,
  score: number
): number {
  const expected = 1 / (1 + Math.pow(10, (GAME_RATING - playerRating) / 400))
  return Math.round(K_FACTOR * (score / 5000 - expected))
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
