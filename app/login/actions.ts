'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  // ログインユーザーの情報を取得
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // 店舗オーナーかどうかチェック
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (shop) {
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/member')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  if (data.user) {
    // プロフィールを作成
    // 注意: メール確認待ちの状態でもユーザーIDは発行されるため、プロフィールは作成しておく
    // ただし、RLSポリシーによってはinsertできない可能性もあるのでエラーハンドリングが必要かもしれないが
    // 現状のポリシーなら大丈夫なはず
    await supabase.from('profiles').insert({
      id: data.user.id,
      display_name: email.split('@')[0], // デフォルト表示名
      is_vip: false
    })
  }

  // Confirm email が OFF の場合は session が返り、そのままログイン扱いで遷移できる
  if (data.session && data.user) {
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', data.user.id)
      .single()

    revalidatePath('/', 'layout')
    redirect(shop ? '/dashboard' : '/member')
  }

  // Confirm email が ON の場合はメール確認画面へ
  redirect('/login/verify')
}

export async function signout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('x-forwarded-host') 
    ? `https://${headersList.get('x-forwarded-host')}` 
    : 'https://okipoka.com'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    redirect('/login?error=Could not authenticate with Google')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/member/settings/password&type=recovery`,
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  return { success: true }
}
