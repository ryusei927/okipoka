import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/member'

  const supabase = await createClient()

  // OAuth callback (Google等)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // ログインユーザーの情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // プロフィールが存在しなければ作成
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: user.id,
            display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
            avatar_url: user.user_metadata?.avatar_url || null,
            is_vip: false
          })
        }

        // 店舗オーナーかどうかチェック
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .single()

        if (shop) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Email OTP verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=Auth verify error', request.url))
}
