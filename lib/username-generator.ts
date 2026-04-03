const ADJECTIVES = [
  'bold',
  'swift',
  'sharp',
  'royal',
  'silent',
  'nimble',
  'fierce',
  'crafty',
  'rapid',
  'calm',
  'brave',
  'keen',
  'dark',
  'light',
  'deep',
]

const NOUNS = [
  'pawn',
  'rook',
  'bishop',
  'knight',
  'queen',
  'king',
  'gambit',
  'blitz',
  'tempo',
  'fork',
  'pin',
  'castle',
]

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `${adj}_${noun}_${num}`
}
