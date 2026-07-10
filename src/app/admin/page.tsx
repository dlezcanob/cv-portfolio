'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, GraduationCap, Award, Upload, FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [cvBaseUrl, setCvBaseUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [counts, setCounts] = useState({ exp: 0, edu: 0, cert: 0 })
  const supabase = createClient()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    const { data: perfil } = await supabase.from('perfil').select('cv_base_url').single()
    setCvBaseUrl(perfil?.cv_base_url || null)

    const [e, d, c] = await Promise.all([
      supabase.from('experiencias').select('id', { count: 'exact', head: true }),
      supabase.from('educacion').select('id', { count: 'exact', head: true }),
      supabase.from('certificaciones').select('id', { count: 'exact', head: true }),
    ])
    setCounts({ exp: e.count || 0, edu: d.count || 0, cert: c.count || 0 })
  }

  async function handleCvBaseUpload(file: File) {
    setUploading(true)
    const filePath = `cv-base/cv_trayectoria_${Date.now()}.pdf`
    const { error } = await supabase.storage.from('archivos').upload(filePath, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(filePath)
      await supabase.from('perfil').update({ cv_base_url: urlData.publicUrl }).not('id', 'is', null)
      setCvBaseUrl(urlData.publicUrl)
    } else {
      alert('Error al subir: ' + error.message)
    }
    setUploading(false)
  }

  const stats = [
    { label: 'Experiencias', count: counts.exp, icon: Briefcase, href: '/admin/experiencias' },
    { label: 'Educacion', count: counts.edu, icon: GraduationCap, href: '/admin/educacion' },
    { label: 'Certificaciones', count: counts.cert, icon: Award, href: '/admin/certificaciones' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* CV Base Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FileText size={18} /> CV Base (Trayectoria)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube tu CV de trayectoria profesional (las primeras paginas de texto, sin certificados).
          Este PDF se usara como base al generar el CV documentado.
        </p>

        {cvBaseUrl ? (
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-sm text-green-700">CV base subido correctamente</span>
            <a href={cvBaseUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">Ver PDF</a>
          </div>
        ) : (
          <p className="text-sm text-orange-600 mb-3">No hay CV base subido aun. Sube tu PDF de trayectoria.</p>
        )}

        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer min-h-[44px] ${uploading ? 'bg-gray-200 text-gray-500' : 'bg-[#1B4F72] text-white hover:bg-[#2E86C1]'} transition-colors`}>
          <Upload size={16} />
          {uploading ? 'Subiendo...' : (cvBaseUrl ? 'Reemplazar CV base' : 'Subir CV base (PDF)')}
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { if (e.target.files?.[0]) handleCvBaseUpload(e.target.files[0]) }}
          />
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1B4F72]/10 rounded-lg">
                <stat.icon size={20} className="text-[#1B4F72]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Acciones */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3">Acciones rapidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/experiencias" className="px-4 py-2 bg-[#1B4F72] text-white rounded-md text-sm font-medium hover:bg-[#2E86C1] transition-colors">
            + Agregar experiencia
          </Link>
          <Link href="/admin/generar-pdf" className="px-4 py-2 border border-[#1B4F72] text-[#1B4F72] rounded-md text-sm font-medium hover:bg-[#1B4F72]/5 transition-colors">
            Generar CV Documentado
          </Link>
          <Link href="/" className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
            Ver portafolio publico
          </Link>
        </div>
      </div>
    </div>
  )
}
