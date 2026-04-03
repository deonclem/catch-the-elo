'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { setUsername, type AuthActionState } from '@/lib/actions/auth'
import { usernameSchema, type UsernameValues } from '@/lib/validations/auth'
import { generateUsername } from '@/lib/username-generator'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface UsernameFormProps {
  defaultUsername: string
}

export function UsernameForm({ defaultUsername }: UsernameFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: defaultUsername },
  })

  function onSubmit(values: UsernameValues) {
    startTransition(async () => {
      const result: AuthActionState = await setUsername(
        undefined as never,
        values
      )
      if (result?.errors) {
        if (result.errors.username) {
          form.setError('username', { message: result.errors.username[0] })
        }
        if (result.errors._form) {
          form.setError('root', { message: result.errors._form[0] })
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input autoComplete="username" {...field} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Suggest another username"
                    onClick={() =>
                      form.setValue('username', generateUsername(), {
                        shouldValidate: true,
                      })
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Your username cannot be changed after this step.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </Form>
  )
}
