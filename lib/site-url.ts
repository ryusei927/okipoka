import { headers } from 'next/headers'

/**
 * リクエストの実際の origin を解決する。
 * ローカル開発では http://localhost:3000、本番ではデプロイ先ドメインを返す。
 * どうしても解決できない場合のみ NEXT_PUBLIC_SITE_URL → 本番ドメインの順でフォールバックする。
 */
export async function getSiteOrigin(): Promise<string> {
  const h = await headers()

  const origin = h.get('origin')
  if (origin) return origin

  const forwardedHost = h.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = h.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${forwardedHost}`
  }

  const host = h.get('host')
  if (host) {
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    return `${isLocal ? 'http' : 'https'}://${host}`
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://okipoka.com'
}
