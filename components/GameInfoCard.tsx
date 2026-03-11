import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  timeControl: string
}

export function GameInfoCard({ timeControl }: Props) {
  return (
    <Card className="w-[95vw] max-w-[560px]">
      <CardHeader>
        <CardTitle className="text-base">White vs Black</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-center text-sm">{timeControl}</div>
      </CardContent>
    </Card>
  )
}
