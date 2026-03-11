'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { upsertUsername } from '@/lib/dal/profiles'
import {
  signUpSchema,
  signInSchema,
  usernameSchema,
  type SignUpValues,
  type SignInValues,
  type UsernameValues,
} from '@/lib/validations/auth'

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

export async function signUp(
  _prevState: AuthActionState,
  data: SignUpValues
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(data)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password, username } = parsed.data
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

  redirect('/')
}

export async function signIn(
  _prevState: AuthActionState,
  data: SignInValues
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(data)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

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

  redirect('/')
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

  const { error } = await upsertUsername(user.id, parsed.data.username)
  if (error === 'username_taken') {
    return { errors: { username: ['Username is already taken'] } }
  }

  redirect('/')
}
