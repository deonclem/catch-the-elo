import { SignInForm } from '@/components/SignInForm'
import { SignUpForm } from '@/components/SignUpForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">CatchTheElo</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to track your ranking
          </p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="pt-4">
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

          <Button variant="outline" className="w-full" disabled>
            Sign in with Google
            <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 text-xs">
              Coming soon
            </span>
          </Button>
        </div>
      </div>
    </main>
  )
}
