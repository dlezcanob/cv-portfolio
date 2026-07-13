'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Upload } from 'lucide-react'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const supabase = createClient()

  const [form, setForm] = useState({
    nombre_completo: '',
    titulo_profesional: '',
    resumen: '',
    email: '',
    telefono: '',
    linkedin_url: '',
  })

  useEffect(() => {
    loadPerfil()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPerfil() {
    const { data } = await supabase.from('perfil').select('*').single()
    if (data) {
      setForm({
        nombre_completo: data.nombre_completo || '',
        titulo_profesional: data.titulo_profesional || '',
        resumen: data.resumen || '',
        email: data.email || '',
        telefono: data.telefono || '',
        linkedin_url: data.linkedin_url || '',
      })
      setFotoUrl(data.foto_url || null)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('perfil').update(form).not('id', 'is', null)
    setSaving(false)
    alert('Perfil actualizado correctamente')
  }

  async function handleFotoUpload(file: File) {
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const filePath = `perfil/foto_${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('archivos').upload(filePath, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(filePath)
      await supabase.from('perfil').update({ foto_url: urlData.publicUrl }).not('id', 'is', null)
      setFotoUrl(urlData.publicUrl)
    } else {
      alert('Error al subir foto: ' + error.message)
    }
    setUploadingFoto(false)
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Perfil</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5 max-w-2xl">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto profesional</label>
          <div className="flex items-center gap-4">
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto actual" className="w-24 h-32 object-cover rounded-lg border border-gray-200" />
            ) : (
              <div className="w-24 h-32 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
            )}
            <div>
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer min-h-[44px] ${uploadingFoto ? 'bg-gray-200 text-gray-500' : 'bg-[#1B4F72] text-white hover:bg-[#2E86C1]'} transition-colors`}>
                <Upload size={16} />
                {uploadingFoto ? 'Subiendo...' : (fotoUrl ? 'Cambiar foto' : 'Subir foto')}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  disabled={uploadingFoto}
                  onChange={(e) => { if (e.target.files?.[0]) handleFotoUpload(e.target.files[0]) }}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">JPG o PNG. Aparecera en el header del CV (arriba a la derecha).</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input type="text" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titulo profesional</label>
          <textarea value={form.titulo_profesional} onChange={(e) => setForm({ ...form, titulo_profesional: e.target.value })} rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          <p className="text-xs text-gray-400 mt-1">Ej: Ingeniero Empresarial con Maestria en Ciencias Empresariales...</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resumen profesional</label>
          <textarea value={form.resumen} onChange={(e) => setForm({ ...form, resumen: e.target.value })} rows={5} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          <p className="text-xs text-gray-400 mt-1">Descripcion de tu experiencia y competencias principales</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input type="text" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#1B4F72] text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-[#2E86C1] transition-colors disabled:opacity-50 min-h-[44px]">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
