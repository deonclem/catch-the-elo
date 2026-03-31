import Image from 'next/image'

const SIZE_MAP = {
  sm: 28,
  md: 36,
  lg: 56,
} as const

type Props = {
  slug: string | null
  size?: keyof typeof SIZE_MAP
}

export function UserAvatar({ slug, size = 'md' }: Props) {
  const px = SIZE_MAP[size]
  const src = slug ? `/avatars/${slug}.jpg` : '/avatars/avatar_default.jpg'

  return (
    <Image
      src={src}
      alt="Avatar"
      width={px}
      height={px}
      className="rounded-full object-cover"
      style={{ width: px, height: px }}
    />
  )
}
