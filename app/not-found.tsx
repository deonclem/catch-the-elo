import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="bg-card border-border flex max-w-sm flex-col items-center gap-8 rounded-2xl border p-12 text-center shadow-sm">
        <Image
          src="/not_found.png"
          alt="Not found illustration"
          width={160}
          height={160}
          className="rounded-xl"
        />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  )
}
