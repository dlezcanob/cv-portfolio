'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X } from 'lucide-react'

interface Referencia {
  id: string
  nombre: string
  telefono: string
  cargo_empresa: string
  orden: number
  visible: boolean
}

export default function ReferenciasPage() {
  const [items, setItems] = useState<Referencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    cargo_empresa: '',
  })

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadItems() {
    const { data } = await supabase.from('referencias').select('*').order('orden', { ascending: true })
    setItems((data || []) as Referencia[])
    setLoading(false)
  }

  function resetForm() {
    setForm({ nombre: '', telefono: '', cargo_empresa: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: Referencia) {
    setForm({ nombre: item.nombre, telefono: item.telefono, cargo_empresa: item.cargo_empresa })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const record = { ...form, orden: items.length }
    if (editingId) {
      await supabase.from('referencias').update(record).eq('id', editingId)
    } else {
      await supabase.from('referencias').insert(record)
    }
    resetForm()
    await loadItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta referencia?')) return
    await supabase.from('referencias').delete().eq('id', id)
    await loadItems()
  }

  async function toggleVisible(item: Referencia) {
    await supabase.from('referencias').update({ visible: !item.visible }).eq('id', item.id)
    await loadItems()
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Referencias</h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Guillermo Rojas" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required placeholder="993 506 588" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Empresa</label>
            <input type="text" value={form.cargo_empresa} onChange={(e) => setForm({ ...form, cargo_empresa: e.target.value })} required placeholder="Ex Gerente General de INAIGEM" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
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
          <p className="text-lg mb-2">No hay referencias registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className={`bg-white border rounded-lg p-4 shadow-sm ${!item.visible ? 'opacity-50 border-dashed' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <span className="font-bold text-gray-800 w-40">{item.nombre}</span>
                  <span className="text-sm text-gray-600 w-28">{item.telefono}</span>
                  <span className="text-sm text-[#2E86C1]">{item.cargo_empresa}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleVisible(item)} className="p-2 hover:bg-gray-100 rounded">{item.visible ? <Eye size={16} className="text-gray-500" /> : <EyeOff size={16} className="text-orange-500" />}</button>
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
