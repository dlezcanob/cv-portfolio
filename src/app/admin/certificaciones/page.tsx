'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Certificacion } from '@/lib/types'
import { Plus, Trash2, Edit2, Save, X, Upload } from 'lucide-react'

export default function CertificacionesPage() {
  const [items, setItems] = useState<Certificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    nombre: '',
    institucion_emisora: '',
    codigo: '',
    fecha_obtencion: '',
  })

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadItems() {
    const { data } = await supabase
      .from('certificaciones')
      .select('*')
      .order('orden', { ascending: true })
    setItems((data || []) as Certificacion[])
    setLoading(false)
  }

  function resetForm() {
    setForm({ nombre: '', institucion_emisora: '', codigo: '', fecha_obtencion: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: Certificacion) {
    setForm({
      nombre: item.nombre,
      institucion_emisora: item.institucion_emisora,
      codigo: item.codigo || '',
      fecha_obtencion: item.fecha_obtencion || '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const record = {
      nombre: form.nombre,
      institucion_emisora: form.institucion_emisora,
      codigo: form.codigo || null,
      fecha_obtencion: form.fecha_obtencion || null,
      orden: items.length,
    }

    if (editingId) {
      await supabase.from('certificaciones').update(record).eq('id', editingId)
    } else {
      await supabase.from('certificaciones').insert(record)
    }

    resetForm()
    await loadItems()
  }

  async function handleFileUpload(certId: string, file: File) {
    setUploading(true)
    const filePath = `certificados/${certId}_${file.name}`
    const { error } = await supabase.storage.from('archivos').upload(filePath, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(filePath)
      await supabase.from('certificaciones').update({ archivo_url: urlData.publicUrl }).eq('id', certId)
      await loadItems()
    } else {
      alert('Error al subir archivo: ' + error.message)
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta certificacion?')) return
    await supabase.from('certificaciones').delete().eq('id', id)
    await loadItems()
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Certificaciones</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-[#1B4F72] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2E86C1] transition-colors min-h-[44px]"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la certificacion</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Project Management Professional (PMP)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institucion emisora</label>
            <input type="text" value={form.institucion_emisora} onChange={(e) => setForm({ ...form, institucion_emisora: e.target.value })} required placeholder="PMI" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codigo (opcional)</label>
              <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="(2020921)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha obtencion (opcional)</label>
              <input type="text" value={form.fecha_obtencion} onChange={(e) => setForm({ ...form, fecha_obtencion: e.target.value })} placeholder="MM/YYYY" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex items-center gap-2 bg-[#1B4F72] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2E86C1] min-h-[44px]">
              <Save size={16} /> {editingId ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" onClick={resetForm} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm hover:bg-gray-50 min-h-[44px]">
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg mb-2">No hay certificaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{item.nombre}</p>
                  <p className="text-sm text-[#2E86C1]">{item.institucion_emisora}</p>
                  {item.codigo && <p className="text-xs text-gray-500 mt-1">{item.codigo}</p>}
                  {item.archivo_url && (
                    <a href={item.archivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 mt-1 inline-block">PDF adjunto</a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <label className="p-2 hover:bg-gray-100 rounded cursor-pointer" title="Subir PDF">
                    <Upload size={16} className="text-blue-500" />
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(item.id, e.target.files[0]) }}
                      disabled={uploading}
                    />
                  </label>
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-gray-100 rounded"><Edit2 size={16} className="text-gray-500" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
