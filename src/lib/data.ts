/**
 * Funciones de acceso a datos del CV desde Supabase.
 */

import { createServerSupabaseClient } from './supabase/server'
import type { CvData, Perfil, Experiencia, Educacion, Certificacion, Habilidad } from './types'

/** Obtiene todos los datos del CV (para PDF y página pública) */
export async function getCvData(): Promise<CvData> {
  const supabase = createServerSupabaseClient()

  const [perfilRes, expRes, eduRes, certRes, habRes] = await Promise.all([
    supabase.from('perfil').select('*').single(),
    supabase.from('experiencias').select('*').eq('visible', true).order('orden', { ascending: true }),
    supabase.from('educacion').select('*').eq('visible', true).order('orden', { ascending: true }),
    supabase.from('certificaciones').select('*').eq('visible', true).order('orden', { ascending: true }),
    supabase.from('habilidades').select('*').eq('visible', true).order('orden', { ascending: true }),
  ])

  return {
    perfil: perfilRes.data as Perfil,
    experiencias: (expRes.data || []) as Experiencia[],
    educacion: (eduRes.data || []) as Educacion[],
    certificaciones: (certRes.data || []) as Certificacion[],
    habilidades: (habRes.data || []) as Habilidad[],
  }
}

/** Obtiene solo el perfil */
export async function getPerfil(): Promise<Perfil | null> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('perfil').select('*').single()
  return data as Perfil | null
}

/** Obtiene todas las experiencias (incluye no visibles, para admin) */
export async function getAllExperiencias(): Promise<Experiencia[]> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('experiencias').select('*').order('orden', { ascending: true })
  return (data || []) as Experiencia[]
}
