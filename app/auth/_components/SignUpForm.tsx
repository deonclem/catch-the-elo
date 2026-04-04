'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { signUp, type AuthActionState } from '@/lib/actions/auth'
import { signUpSchema, type SignUpValues } from '@/lib/validations/auth'
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
import { cn } from '@/lib/utils'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

function PasswordStrengthHints({ password }: { password: string }) {
  if (!password) return null
  return (
    <ul className="mt-1 space-y-1">
      {PASSWORD_RULES.map(({ label, test }) => {
        const ok = test(password)
        return (
          <li
            key={label}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              ok ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {ok ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <XCircle className="size-3.5 shrink-0" />
            )}
            {label}
          </li>
        )
      })}
    </ul>
  )
}

export function SignUpForm({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', username: '' },
  })

  const password = useWatch({ control: form.control, name: 'password' })

  function onSubmit(values: SignUpValues) {
    startTransition(async () => {
      const result: AuthActionState = await signUp(
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
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <PasswordStrengthHints password={password} />
              <FormMessage />
            </FormItem>
          )}
        />

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
          {isPending ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </Form>
  )
}
