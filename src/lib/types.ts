/**
 * Tipos TypeScript para el CV Portfolio Platform.
 */

export interface Perfil {
  id: string
  nombre_completo: string
  titulo_profesional: string
  resumen: string
  email: string
  telefono: string
  linkedin_url: string
  foto_url: string | null
  created_at: string
  updated_at: string
}

export interface Experiencia {
  id: string
  fecha_inicio: string // MM/YYYY
  fecha_fin: string // MM/YYYY o "Actualidad"
  institucion: string
  cargo: string
  funciones: string[] // Array de funciones con checkmark
  logros: string[] | null // Logros opcionales
  reconocimientos: Reconocimiento[] | null
  proyectos: string[] | null // Lista numerada de proyectos
  orden: number
  visible: boolean
  created_at: string
  updated_at: string
}

export interface Reconocimiento {
  titulo: string
  url?: string
}

export interface Educacion {
  id: string
  institucion: string
  titulo: string
  fecha_inicio: string
  fecha_fin: string
  orden: number
  visible: boolean
  created_at: string
}

export interface Certificacion {
  id: string
  nombre: string
  institucion_emisora: string
  codigo: string | null // Ej: "(PMP)® (2020921)"
  fecha_obtencion: string | null
  archivo_url: string | null // URL del PDF en Supabase Storage
  orden: number
  visible: boolean
  created_at: string
}

export interface Habilidad {
  id: string
  nombre: string
  categoria: string | null
  orden: number
  visible: boolean
}

/** Datos completos del CV para generar PDF */
export interface CvData {
  perfil: Perfil
  experiencias: Experiencia[]
  educacion: Educacion[]
  certificaciones: Certificacion[]
  habilidades: Habilidad[]
}

/** Opciones para generar PDF */
export interface PdfGenerationOptions {
  mode: 'simple' | 'documentado'
  empresa?: string // Para watermark
}
