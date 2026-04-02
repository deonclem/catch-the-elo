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

const FRENCH_WORDS = [
  'merde',
  'putain',
  'connard',
  'connarde',
  'connards',
  'connasse',
  'salope',
  'salaud',
  'encule',
  'enculé',
  'foutre',
  'bordel',
  'bite',
  'bites',
  'chier',
  'baiser',
  'couille',
  'couilles',
  'nichon',
  'nichons',
  'con',
  'conne',
  'cons',
  'connes',
  'pute',
  'putes',
  'putasse',
  'batard',
  'bâtard',
  'batards',
  'bâtards',
  'salopard',
  'salopards',
  'enfoiré',
  'enfoirés',
  'nique',
  'niquer',
  'ntm',
  'fdp',
  'pd',
  'tapette',
  'tabarnak',
  'ostie',
  'crisse',
  'câlice',
  'calice',
  'tabarnak',
  'viarge',
  'ciboire',
]

leoProfanity.loadDictionary()
leoProfanity.add(FRENCH_WORDS)

export function isUsernameAllowed(username: string): boolean {
  const lower = username.toLowerCase()
  return leoProfanity.check(lower) || RESERVED.has(lower)
}
