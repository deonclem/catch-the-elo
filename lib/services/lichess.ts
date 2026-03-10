import { z } from 'zod'

const LichessPlayerSchema = z.object({
  user: z.object({ name: z.string(), id: z.string() }).optional(),
  rating: z.number().int().positive().optional().nullable(),
  ratingDiff: z.number().int().optional(),
})

const LichessGameSchema = z.object({
  id: z.string(),
  rated: z.boolean(),
  variant: z.string(),
  speed: z.string(),
  perf: z.string(),
  status: z.string(),
  players: z.object({
    white: LichessPlayerSchema,
    black: LichessPlayerSchema,
  }),
  winner: z.enum(['white', 'black']).optional(),
  moves: z.string().min(1),
})

export type LichessGame = z.infer<typeof LichessGameSchema>

const LICHESS_URL =
  'https://lichess.org/api/games/user/DrNykterstein?max=20&rated=true&moves=true'

export async function fetchRandomLichessGame(): Promise<LichessGame> {
  const response = await fetch(LICHESS_URL, {
    headers: { Accept: 'application/x-ndjson' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Lichess API error: ${response.status}`)
  }

  const text = await response.text()
  const lines = text.trim().split('\n').filter(Boolean)

  const games: LichessGame[] = []
  for (const line of lines) {
    try {
      const raw: unknown = JSON.parse(line)
      const result = LichessGameSchema.safeParse(raw)
      if (result.success) {
        games.push(result.data)
      }
    } catch {
      // skip malformed JSON lines
    }
  }

  if (games.length === 0) {
    throw new Error('No valid games found in Lichess response')
  }

  const randomIndex = Math.floor(Math.random() * games.length)
  return games[randomIndex]!
}
