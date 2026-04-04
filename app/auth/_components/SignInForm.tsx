'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { signIn, type AuthActionState } from '@/lib/actions/auth'
import { signInSchema, type SignInValues } from '@/lib/validations/auth'
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

export function SignInForm({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: SignInValues) {
    startTransition(async () => {
      const result: AuthActionState = await signIn(
        undefined as never,
        values,
        next
      )
      if (result?.errors) {
        if (result.errors.email) {
          form.setError('email', { message: result.errors.email[0] })
        }
        if (result.errors.password) {
          form.setError('password', { message: result.errors.password[0] })
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
          {isPending ? 'Logging in…' : 'Log In'}
        </Button>
      </form>
    </Form>
  )
}
