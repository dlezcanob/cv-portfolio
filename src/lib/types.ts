export interface Perfil {
  id: string
  nombre_completo: string
  titulo_profesional: string
  resumen: string
  email: string
  telefono: string
  linkedin_url: string
  foto_url: string | null
  cv_base_url: string | null
  created_at: string
  updated_at: string
}

export interface Experiencia {
  id: string
  fecha_inicio: string
  fecha_fin: string
  institucion: string
  cargo: string
  funciones: string[]
  logros: string[] | null
  reconocimientos: Reconocimiento[] | null
  proyectos: string[] | null
  archivo_url: string | null
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
  archivo_url: string | null
  tipo: string
  orden: number
  visible: boolean
  created_at: string
}

export interface Certificacion {
  id: string
  nombre: string
  institucion_emisora: string
  codigo: string | null
  fecha_obtencion: string | null
  archivo_url: string | null
  principal: boolean
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

export interface CvData {
  perfil: Perfil
  experiencias: Experiencia[]
  educacion: Educacion[]
  certificaciones: Certificacion[]
  habilidades: Habilidad[]
}

export interface PdfGenerationOptions {
  mode: 'simple' | 'documentado'
  empresa?: string
}
