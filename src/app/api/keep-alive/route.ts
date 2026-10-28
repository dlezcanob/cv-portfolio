/**
 * API Route para mantener activo el proyecto de Supabase.
 * GET /api/keep-alive — hace una consulta mínima a la BD para registrar actividad
 * y evitar que Supabase pause el proyecto (plan gratuito) por inactividad.
 *
 * Se invoca automáticamente mediante un Vercel Cron (ver vercel.json).
 * Si CRON_SECRET está configurado, exige el header Authorization: Bearer <CRON_SECRET>.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Evita el cacheo: debe ejecutarse en cada invocación del cron.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Protección opcional: solo permitir si el secreto coincide (Vercel Cron lo envía).
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createServerSupabaseClient()

    // Consulta mínima: solo cuenta filas, no trae datos. Suficiente para marcar actividad.
    const { error } = await supabase
      .from('perfil')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, ts: new Date().toISOString() },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown', ts: new Date().toISOString() },
      { status: 500 }
    )
  }
}
