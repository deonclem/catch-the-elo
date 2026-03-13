'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { setUsername, type AuthActionState } from '@/lib/actions/auth'
import { usernameSchema, type UsernameValues } from '@/lib/validations/auth'
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

export function UsernameForm() {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: '' },
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
                <Input
                  placeholder="chess_wizard"
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
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
