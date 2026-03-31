'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { updateAvatar } from '@/lib/actions/profile'
import { AVAILABLE_AVATARS } from '@/lib/avatars'
import { cn } from '@/lib/utils'

type Props = {
  currentSlug: string | null
}

export function AvatarPickerDialog({ currentSlug }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentSlug)
  const [saving, setSaving] = useState(false)

  function handleOpen(isOpen: boolean) {
    if (isOpen) setPreview(currentSlug)
    setOpen(isOpen)
  }

  async function handleConfirm() {
    if (!preview || preview === currentSlug) {
      setOpen(false)
      return
    }
    setSaving(true)
    await updateAvatar(preview)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  const triggerSrc = currentSlug
    ? `/avatars/${currentSlug}.jpg`
    : '/avatars/avatar_default.jpg'

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="focus-visible:ring-ring relative shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Change avatar"
        >
          <Image
            src={triggerSrc}
            alt="Your avatar"
            width={56}
            height={56}
            className="rounded-full object-cover"
            style={{ width: 56, height: 56 }}
          />
          <span className="bg-background border-border absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full border">
            <Pencil className="size-3" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose an avatar</DialogTitle>
        </DialogHeader>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-4 py-2">
          {AVAILABLE_AVATARS.map((slug) => {
            const isSelected = preview === slug
            return (
              <button
                key={slug}
                onClick={() => setPreview(slug)}
                className="focus-visible:ring-ring group flex cursor-pointer items-center justify-center rounded-lg p-2 focus-visible:ring-2 focus-visible:outline-none"
                aria-label={slug}
                aria-pressed={isSelected}
              >
                <div className="relative size-16">
                  <Image
                    src={`/avatars/${slug}.jpg`}
                    alt={slug}
                    width={64}
                    height={64}
                    className={cn(
                      'ring-offset-background rounded-full object-cover transition-all duration-150 group-hover:scale-105',
                      isSelected
                        ? 'ring-primary ring-2 ring-offset-2'
                        : 'group-hover:ring-muted-foreground group-hover:ring-2 group-hover:ring-offset-2'
                    )}
                    style={{ width: 64, height: 64 }}
                  />
                  {isSelected && (
                    <span className="bg-primary text-primary-foreground absolute right-0 bottom-0 flex size-4 items-center justify-center rounded-full">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={saving || preview === currentSlug}
          >
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
