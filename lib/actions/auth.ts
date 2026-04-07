'use server'

import {
  isUsernameTaken,
  markOnboarded,
  upsertUsername,
} from '@/lib/dal/profiles'
import { savePendingDailyResult } from '@/lib/helpers/pending-daily-result'
import { isUsernameAllowed } from '@/lib/username-filter'
import {
  signInSchema,
  signUpSchema,
  usernameSchema,
  type SignInValues,
  type SignUpValues,
  type UsernameValues,
} from '@/lib/validations/auth'
import { getPostHogClient } from '@/lib/posthog-server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthActionState = {
  errors?: {
    email?: string[]
    password?: string[]
    username?: string[]
    _form?: string[]
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function safeNext(next: string | undefined): string {
  return next?.startsWith('/') ? next : '/'
}

export async function signUp(
  _prevState: AuthActionState,
  data: SignUpValues,
  next?: string
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(data)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password, username } = parsed.data

  if (isUsernameAllowed(username)) {
    return { errors: { username: ['This username is not allowed'] } }
  }

  if (await isUsernameTaken(username)) {
    return { errors: { username: ['Username is already taken'] } }
  }

  const supabase = await createClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    const msg = signUpError.message.toLowerCase()
    if (
      msg.includes('already registered') ||
      msg.includes('already been registered')
    ) {
      return {
        errors: { email: ['An account with this email already exists'] },
      }
    }
    return { errors: { _form: [signUpError.message] } }
  }

  const user = authData.user
  if (!user) {
    return { errors: { _form: ['Sign up failed. Please try again.'] } }
  }

  const { error: usernameError } = await upsertUsername(user.id, username)
  if (usernameError === 'username_taken') {
    return { errors: { username: ['Username is already taken'] } }
  }

  await savePendingDailyResult(user.id)
  await markOnboarded(user.id)

  const posthog = getPostHogClient()
  posthog.identify({ distinctId: user.id, properties: { email, username } })
  posthog.capture({
    distinctId: user.id,
    event: 'user_signed_up',
    properties: { username, method: 'email' },
  })
  await posthog.shutdown()

  redirect(next?.startsWith('/') && next !== '/' ? next : '/welcome')
}

export async function signIn(
  _prevState: AuthActionState,
  data: SignInValues,
  next?: string
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(data)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('invalid login credentials') ||
      msg.includes('invalid credentials')
    ) {
      return { errors: { _form: ['Incorrect email or password'] } }
    }
    return { errors: { _form: [error.message] } }
  }

  if (signInData.user) {
    const posthog = getPostHogClient()
    posthog.identify({ distinctId: signInData.user.id, properties: { email } })
    posthog.capture({
      distinctId: signInData.user.id,
      event: 'user_signed_in',
      properties: { method: 'email' },
    })
    await posthog.shutdown()
  }

  redirect(safeNext(next))
}

export async function signInWithGoogle(next?: string): Promise<never> {
  const supabase = await createClient()
  const callbackUrl = new URL(
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  )
  if (next?.startsWith('/')) callbackUrl.searchParams.set('next', next)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (error || !data.url) {
    redirect('/auth?error=oauth')
  }

  redirect(data.url)
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth')
}

export async function setUsername(
  _prevState: AuthActionState,
  data: UsernameValues
): Promise<AuthActionState> {
  const parsed = usernameSchema.safeParse(data)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  if (isUsernameAllowed(parsed.data.username)) {
    return { errors: { username: ['This username is not allowed'] } }
  }

  const { error } = await upsertUsername(user.id, parsed.data.username)
  if (error === 'username_taken') {
    return { errors: { username: ['Username is already taken'] } }
  }

  await markOnboarded(user.id)
  redirect('/welcome')
}
