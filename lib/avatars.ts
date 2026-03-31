export const AVAILABLE_AVATARS = [
  'avatar_01',
  'avatar_02',
  'avatar_03',
  'avatar_04',
  'avatar_05',
  'avatar_06',
  'avatar_07',
  'avatar_08',
  'avatar_09',
] as const

export type AvatarSlug = (typeof AVAILABLE_AVATARS)[number]
