import { getProfiles } from '@/lib/dal/profiles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home() {
  const profiles = await getProfiles()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Catch The Elo</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profiles ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-muted-foreground text-xs">
            {JSON.stringify(profiles, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </main>
  )
}
