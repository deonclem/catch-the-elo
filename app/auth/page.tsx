import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Metadata } from 'next'
import Image from 'next/image'
import { GoogleButton } from './_components/GoogleButton'
import { SignInForm } from './_components/SignInForm'
import { SignUpForm } from './_components/SignUpForm'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; next?: string }>
}) {
  const { tab, next } = await searchParams
  const defaultTab = tab === 'signup' ? 'signup' : 'login'
  const safeNext = next?.startsWith('/') ? next : undefined

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="Gueslo"
              width={36}
              height={36}
              className="rounded-sm"
            />
            <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Gueslo
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Log in to play ranked mode and track your scores!
          </p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Log In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Create an account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="pt-4">
            <SignInForm next={safeNext} />
          </TabsContent>

          <TabsContent value="signup" className="pt-4">
            <SignUpForm next={safeNext} />
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <div className="relative">
            <Separator />
            <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
              or
            </span>
          </div>

          <GoogleButton next={safeNext} />
        </div>
      </div>
    </main>
  )
}
