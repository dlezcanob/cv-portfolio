'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Educacion } from '@/lib/types'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

export default function EducacionPage() {
  const [items, setItems] = useState<Educacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()

  const [form, setForm] = useState({
    institucion: '',
    titulo: '',
    fecha_inicio: '',
    fecha_fin: '',
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
    setForm({ institucion: '', titulo: '', fecha_inicio: '', fecha_fin: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: Educacion) {
    setForm({
      institucion: item.institucion,
      titulo: item.titulo,
      fecha_inicio: item.fecha_inicio,
      fecha_fin: item.fecha_fin,
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
    if (!confirm('Eliminar este registro de educacion?')) return
    await supabase.from('educacion').delete().eq('id', id)
    await loadItems()
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Educacion</h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Institucion</label>
            <input type="text" value={form.institucion} onChange={(e) => setForm({ ...form, institucion: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo / Grado</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio (MM/YYYY)</label>
              <input type="text" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input type="text" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} required placeholder="Actualidad" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
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
          <p className="text-lg mb-2">No hay registros de educacion</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-800">{item.titulo}</p>
                  <p className="text-sm text-[#2E86C1]">{item.institucion}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.fecha_inicio} - {item.fecha_fin}</p>
                </div>
                <div className="flex items-center gap-1">
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
