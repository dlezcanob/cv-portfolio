'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Educacion } from '@/lib/types'
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X, Upload, FileText } from 'lucide-react'

export default function EducacionPage() {
  const [items, setItems] = useState<Educacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    institucion: '',
    titulo: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'grado',
  })

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadItems() {
    const { data } = await supabase
      .from('educacion')
      .select('*')
      .order('orden', { ascending: true })
    setItems((data || []) as Educacion[])
    setLoading(false)
  }

  function resetForm() {
    setForm({ institucion: '', titulo: '', fecha_inicio: '', fecha_fin: '', tipo: 'grado' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: Educacion) {
    setForm({
      institucion: item.institucion,
      titulo: item.titulo,
      fecha_inicio: item.fecha_inicio,
      fecha_fin: item.fecha_fin,
      tipo: (item as Educacion & { tipo?: string }).tipo || 'grado',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const record = { ...form, orden: items.length }

    if (editingId) {
      await supabase.from('educacion').update(record).eq('id', editingId)
    } else {
      await supabase.from('educacion').insert(record)
    }

    resetForm()
    await loadItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este registro?')) return
    await supabase.from('educacion').delete().eq('id', id)
    await loadItems()
  }

  async function toggleVisible(item: Educacion) {
    await supabase.from('educacion').update({ visible: !item.visible }).eq('id', item.id)
    await loadItems()
  }

  async function handleFileUpload(itemId: string, file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `educacion/${itemId}_${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('archivos').upload(filePath, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(filePath)
      await supabase.from('educacion').update({ archivo_url: urlData.publicUrl }).eq('id', itemId)
      await loadItems()
    } else {
      alert('Error al subir archivo: ' + error.message)
    }
    setUploading(false)
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>

  const grados = items.filter((i) => (i as Educacion & { tipo?: string }).tipo !== 'curso')
  const cursos = items.filter((i) => (i as Educacion & { tipo?: string }).tipo === 'curso')
    const cursos = items.filter((i) => (i as Educacion & { tipo?: string }).tipo === 'curso').sort((a, b) => {
    const meses: Record<string, number> = { 'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12 }
    const parse = (d: string) => { const p = d.split(' '); return parseInt(p[1]) * 12 + (meses[p[0]] || 0) }
    return parse(b.fecha_inicio) - parse(a.fecha_inicio)
  })


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Educacion y Cursos</h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none">
              <option value="grado">Grado academico (Maestria, Ingenieria, Licenciatura)</option>
              <option value="curso">Curso / Diplomado / Especializacion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institucion</label>
            <input type="text" value={form.institucion} onChange={(e) => setForm({ ...form, institucion: e.target.value })} required placeholder="USIL, SERVIR ENAP, AWS..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo / Nombre del curso</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required placeholder="Maestria en Administracion..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha (MM/YYYY o Mes YYYY)</label>
              <input type="text" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} required placeholder="Octubre 2025" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (solo grados)</label>
              <input type="text" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} placeholder="Actualidad o dejar vacio" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
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

      {/* Grados Academicos */}
      {grados.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">Grados Academicos</h2>
          <div className="space-y-3">
            {grados.map((item) => (
              <div key={item.id} className={`bg-white border rounded-lg p-4 shadow-sm ${!item.visible ? 'opacity-50 border-dashed' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.fecha_inicio} - {item.fecha_fin}</span>
                      {!item.visible && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Oculto</span>}
                      {item.archivo_url && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Sustento</span>}
                    </div>
                    <p className="font-bold text-gray-800">{item.titulo}</p>
                    <p className="text-sm text-[#2E86C1]">{item.institucion}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className={`p-2 hover:bg-blue-50 rounded cursor-pointer ${uploading ? 'opacity-50' : ''}`} title="Subir sustento">
                      <Upload size={16} className="text-blue-500" />
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(item.id, e.target.files[0]) }} />
                    </label>
					{item.archivo_url && (
                      <a href={item.archivo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded" title="Ver sustento">
                        <FileText size={14} className="text-green-500" />
                      </a>
                    )}

                    {item.archivo_url && <a href={item.archivo_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded"><FileText size={16} className="text-green-500" /></a>}
                    <button onClick={() => toggleVisible(item)} className="p-2 hover:bg-gray-100 rounded">{item.visible ? <Eye size={16} className="text-gray-500" /> : <EyeOff size={16} className="text-orange-500" />}</button>
                    <button onClick={() => startEdit(item)} className="p-2 hover:bg-gray-100 rounded"><Edit2 size={16} className="text-gray-500" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-500" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cursos y Diplomados */}
      {cursos.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-3">Cursos y Diplomados</h2>
          <div className="space-y-2">
            {cursos.map((item) => (
              <div key={item.id} className={`bg-white border rounded-lg p-3 shadow-sm ${!item.visible ? 'opacity-50 border-dashed' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">{item.fecha_inicio}</span>
                    <span className="text-xs text-[#2E86C1] w-36 flex-shrink-0">{item.institucion}</span>
                    <span className="text-sm font-medium text-gray-800">{item.titulo}</span>
                    {item.archivo_url && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Sustento</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className={`p-2 hover:bg-blue-50 rounded cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                      <Upload size={14} className="text-blue-500" />
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(item.id, e.target.files[0]) }} />
                    </label>
					{item.archivo_url && (
                      <a href={item.archivo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded" title="Ver sustento">
                        <FileText size={14} className="text-green-500" />
                      </a>
                    )}
                    <button onClick={() => toggleVisible(item)} className="p-1.5 hover:bg-gray-100 rounded">{item.visible ? <Eye size={14} className="text-gray-500" /> : <EyeOff size={14} className="text-orange-500" />}</button>
                    <button onClick={() => startEdit(item)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={14} className="text-gray-500" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={14} className="text-red-500" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg mb-2">No hay registros de educacion</p>
        </div>
      )}
    </div>
  )
}
