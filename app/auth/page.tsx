import { SignInForm } from './_components/SignInForm'
import { SignUpForm } from './_components/SignUpForm'
import { GoogleButton } from './_components/GoogleButton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Gueslo</h1>
          <p className="text-muted-foreground text-sm">
            Log in to track your ranking
          </p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Log In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="pt-4">
            <SignInForm />
          </TabsContent>

          <TabsContent value="signup" className="pt-4">
            <SignUpForm />
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <div className="relative">
            <Separator />
            <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
              or
            </span>
          </div>

          <GoogleButton />
        </div>
      </div>
    </main>
  )
}
