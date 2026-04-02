import leoProfanity from 'leo-profanity'

const RESERVED = new Set([
  'admin',
  'administrator',
  'moderator',
  'mod',
  'support',
  'help',
  'staff',
  'system',
  'root',
  'gueslo',
  'gues_lo',
  'chess',
])

leoProfanity.loadDictionary()

export function isUsernameAllowed(username: string): boolean {
  const lower = username.toLowerCase()
  return leoProfanity.check(lower) || RESERVED.has(lower)
}
