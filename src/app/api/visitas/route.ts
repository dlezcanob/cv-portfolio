/**
 * API Route para registrar visitas a la página pública.
 * POST /api/visitas — registra una visita anónima.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pagina = body.pagina || '/'
    const referrer = body.referrer || null

    // Hash simple del IP para analytics sin guardar IP real
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const ipHash = await hashString(ip)

    const userAgent = request.headers.get('user-agent') || null

    const supabase = createServerSupabaseClient()
    await supabase.from('visitas').insert({
      pagina,
      referrer,
      user_agent: userAgent,
      ip_hash: ipHash,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/** Hash simple para anonimizar IP */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + 'cv-portfolio-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
