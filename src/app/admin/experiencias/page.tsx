'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Experiencia } from '@/lib/types'
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X, Upload, FileText } from 'lucide-react'

export default function ExperienciasPage() {
  const [experiencias, setExperiencias] = useState<Experiencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    fecha_inicio: '',
    fecha_fin: 'Actualidad',
    institucion: '',
    cargo: '',
    funciones: '',
    logros: '',
    reconocimientos: '',
    proyectos: '',
  })

  useEffect(() => {
    loadExperiencias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadExperiencias() {
    const { data } = await supabase
      .from('experiencias')
      .select('*')
      .order('orden', { ascending: true })

    const sorted = (data || []).sort((a, b) => {
      if (a.fecha_fin === 'Actualidad' && b.fecha_fin !== 'Actualidad') return -1
      if (b.fecha_fin === 'Actualidad' && a.fecha_fin !== 'Actualidad') return 1
      const parseDate = (d: string) => {
        const [m, y] = d.split('/')
        return parseInt(y) * 12 + parseInt(m)
      }
      return parseDate(b.fecha_inicio) - parseDate(a.fecha_inicio)
    })

    setExperiencias(sorted as Experiencia[])
    setLoading(false)
  }

  function resetForm() {
    setForm({ fecha_inicio: '', fecha_fin: 'Actualidad', institucion: '', cargo: '', funciones: '', logros: '', reconocimientos: '', proyectos: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(exp: Experiencia) {
    setForm({
      fecha_inicio: exp.fecha_inicio,
      fecha_fin: exp.fecha_fin,
      institucion: exp.institucion,
      cargo: exp.cargo,
      funciones: Array.isArray(exp.funciones) ? exp.funciones.join('\n') : '',
      logros: Array.isArray(exp.logros) ? exp.logros.join('\n') : '',
      reconocimientos: Array.isArray(exp.reconocimientos) ? exp.reconocimientos.map((r: { titulo: string; url?: string }) => r.url ? r.titulo + ' - ' + r.url : r.titulo).join('\n') : '',
      proyectos: Array.isArray(exp.proyectos) ? exp.proyectos.join('\n') : '',
    })
    setEditingId(exp.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const funciones = form.funciones.split('\n').filter((f) => f.trim())
    const logrosArr = form.logros.split('\n').filter((l) => l.trim())
    const proyectosArr = form.proyectos.split('\n').filter((p) => p.trim())
    const reconocimientosArr = form.reconocimientos.split('\n').filter((r) => r.trim()).map((r) => {
      const parts = r.split(' - ')
      return parts.length > 1 ? { titulo: parts[0].trim(), url: parts.slice(1).join(' - ').trim() } : { titulo: r.trim() }
    })

    const record = {
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      institucion: form.institucion,
      cargo: form.cargo,
      funciones,
      logros: logrosArr.length > 0 ? logrosArr : null,
      reconocimientos: reconocimientosArr.length > 0 ? reconocimientosArr : null,
      proyectos: proyectosArr.length > 0 ? proyectosArr : null,
      orden: experiencias.length,
    }

    if (editingId) {
      await supabase.from('experiencias').update(record).eq('id', editingId)
    } else {
      await supabase.from('experiencias').insert(record)
    }

    resetForm()
    await loadExperiencias()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta experiencia?')) return
    await supabase.from('experiencias').delete().eq('id', id)
    await loadExperiencias()
  }

  async function toggleVisible(exp: Experiencia) {
    await supabase.from('experiencias').update({ visible: !exp.visible }).eq('id', exp.id)
    await loadExperiencias()
  }

  async function handleFileUpload(expId: string, file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `experiencias/${expId}_${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('archivos').upload(filePath, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(filePath)
      await supabase.from('experiencias').update({ archivo_url: urlData.publicUrl }).eq('id', expId)
      await loadExperiencias()
    } else {
      alert('Error al subir archivo: ' + error.message)
    }
    setUploading(false)
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Experiencias</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-[#1B4F72] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2E86C1] transition-colors min-h-[44px]"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio (MM/YYYY)</label>
              <input type="text" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} placeholder="06/2022" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input type="text" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} placeholder="Actualidad" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institucion</label>
            <input type="text" value={form.institucion} onChange={(e) => setForm({ ...form, institucion: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input type="text" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funciones (una por linea)</label>
            <textarea value={form.funciones} onChange={(e) => setForm({ ...form, funciones: e.target.value })} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            <p className="text-xs text-gray-400 mt-1">Cada linea sera un bullet en el CV</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logros (opcional, uno por linea)</label>
            <textarea value={form.logros} onChange={(e) => setForm({ ...form, logros: e.target.value })} rows={3} placeholder="Ej: Implementacion del Sistema de Gestion Documental" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            <p className="text-xs text-gray-400 mt-1">Si no hay logros, deja vacio. No aparecera en el CV.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reconocimientos (opcional, uno por linea)</label>
            <textarea value={form.reconocimientos} onChange={(e) => setForm({ ...form, reconocimientos: e.target.value })} rows={3} placeholder="Ej: Caso de exito AWS - https://aws.amazon.com/es/partners/success/inaigem-itera/" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            <p className="text-xs text-gray-400 mt-1">Formato: Titulo - URL (la URL es opcional). Uno por linea.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyectos principales (opcional, uno por linea)</label>
            <textarea value={form.proyectos} onChange={(e) => setForm({ ...form, proyectos: e.target.value })} rows={3} placeholder="Ej: Implementacion del Modelo de Gestion Documental (DL 1310)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            <p className="text-xs text-gray-400 mt-1">Se mostraran numerados en el CV. Deja vacio si no aplica.</p>
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

      {experiencias.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg mb-2">No hay experiencias registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiencias.map((exp) => (
            <div
              key={exp.id}
              className={`bg-white border rounded-lg p-4 shadow-sm ${!exp.visible ? 'opacity-50 border-dashed' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{exp.fecha_inicio} - {exp.fecha_fin}</span>
                    {!exp.visible && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Oculta</span>}
                    {exp.archivo_url && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Sustento</span>}
                    {Array.isArray(exp.logros) && exp.logros.length > 0 && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{exp.logros.length} logros</span>}
                    {Array.isArray(exp.reconocimientos) && exp.reconocimientos.length > 0 && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{exp.reconocimientos.length} reconoc.</span>}
                    {Array.isArray(exp.proyectos) && exp.proyectos.length > 0 && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{exp.proyectos.length} proyectos</span>}
                  </div>
                  <p className="font-bold text-gray-800">{exp.cargo}</p>
                  <p className="text-sm text-[#2E86C1]">{exp.institucion}</p>
                  <p className="text-xs text-gray-500 mt-1">{Array.isArray(exp.funciones) ? exp.funciones.length : 0} funciones</p>
                </div>
                <div className="flex items-center gap-1">
                  <label className={`p-2 hover:bg-blue-50 rounded cursor-pointer ${uploading ? 'opacity-50' : ''}`} title="Subir sustento PDF o imagen">
                    <Upload size={16} className="text-blue-500" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(exp.id, e.target.files[0]) }}
                    />
                  </label>
                  {exp.archivo_url && (
                    <a href={exp.archivo_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded" title="Ver sustento">
                      <FileText size={16} className="text-green-500" />
                    </a>
                  )}
                  <button onClick={() => toggleVisible(exp)} className="p-2 hover:bg-gray-100 rounded" title={exp.visible ? 'Ocultar del CV' : 'Mostrar en CV'}>
                    {exp.visible ? <Eye size={16} className="text-gray-500" /> : <EyeOff size={16} className="text-orange-500" />}
                  </button>
                  <button onClick={() => startEdit(exp)} className="p-2 hover:bg-gray-100 rounded" title="Editar">
                    <Edit2 size={16} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="p-2 hover:bg-red-50 rounded" title="Eliminar">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
