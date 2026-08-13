'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Experiencia } from '@/lib/types'
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X, Upload, FileText } from 'lucide-react'

interface CargoForm {
  id?: string // Si existe, es un cargo que ya está en BD
  fecha_inicio: string
  fecha_fin: string
  cargo: string
  funciones: string
  logros: string
  reconocimientos: string
  proyectos: string
}

function emptyCargoForm(): CargoForm {
  return { fecha_inicio: '', fecha_fin: 'Actualidad', cargo: '', funciones: '', logros: '', reconocimientos: '', proyectos: '' }
}

export default function ExperienciasPage() {
  const [experiencias, setExperiencias] = useState<Experiencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingInstitucion, setEditingInstitucion] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const [institucion, setInstitucion] = useState('')
  const [cargos, setCargos] = useState<CargoForm[]>([emptyCargoForm()])

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
    setInstitucion('')
    setCargos([emptyCargoForm()])
    setEditingInstitucion(null)
    setShowForm(false)
  }

  function startEditGroup(inst: string) {
    const group = experiencias.filter((e) => e.institucion === inst)
    setInstitucion(inst)
    setCargos(group.map((exp) => ({
      id: exp.id,
      fecha_inicio: exp.fecha_inicio,
      fecha_fin: exp.fecha_fin,
      cargo: exp.cargo,
      funciones: Array.isArray(exp.funciones) ? exp.funciones.join('\n') : '',
      logros: Array.isArray(exp.logros) ? exp.logros.join('\n') : '',
      reconocimientos: Array.isArray(exp.reconocimientos) ? exp.reconocimientos.map((r: { titulo: string; url?: string }) => r.url ? r.titulo + ' - ' + r.url : r.titulo).join('\n') : '',
      proyectos: Array.isArray(exp.proyectos) ? exp.proyectos.join('\n') : '',
    })))
    setEditingInstitucion(inst)
    setShowForm(true)
  }

  function updateCargo(index: number, field: keyof CargoForm, value: string) {
    setCargos((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function addCargo() {
    setCargos((prev) => [...prev, emptyCargoForm()])
  }

  function removeCargo(index: number) {
    if (cargos.length <= 1) return
    setCargos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Si estamos editando, eliminar los registros anteriores de esa institución que no están en el form
    if (editingInstitucion) {
      const existingIds = experiencias.filter((e) => e.institucion === editingInstitucion).map((e) => e.id)
      const keepIds = cargos.filter((c) => c.id).map((c) => c.id!)
      const deleteIds = existingIds.filter((id) => !keepIds.includes(id))
      for (const id of deleteIds) {
        await supabase.from('experiencias').delete().eq('id', id)
      }
    }

    // Guardar/actualizar cada cargo
    for (let i = 0; i < cargos.length; i++) {
      const c = cargos[i]
      const funciones = c.funciones.split('\n').filter((f) => f.trim())
      const logrosArr = c.logros.split('\n').filter((l) => l.trim())
      const proyectosArr = c.proyectos.split('\n').filter((p) => p.trim())
      const reconocimientosArr = c.reconocimientos.split('\n').filter((r) => r.trim()).map((r) => {
        const parts = r.split(' - ')
        return parts.length > 1 ? { titulo: parts[0].trim(), url: parts.slice(1).join(' - ').trim() } : { titulo: r.trim() }
      })

      const record = {
        fecha_inicio: c.fecha_inicio,
        fecha_fin: c.fecha_fin,
        institucion,
        cargo: c.cargo,
        funciones,
        logros: logrosArr.length > 0 ? logrosArr : null,
        reconocimientos: reconocimientosArr.length > 0 ? reconocimientosArr : null,
        proyectos: proyectosArr.length > 0 ? proyectosArr : null,
        orden: experiencias.length + i,
      }

      if (c.id) {
        await supabase.from('experiencias').update(record).eq('id', c.id)
      } else {
        await supabase.from('experiencias').insert(record)
      }
    }

    resetForm()
    await loadExperiencias()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta experiencia?')) return
    await supabase.from('experiencias').delete().eq('id', id)
    await loadExperiencias()
  }

  async function handleDeleteGroup(inst: string) {
    if (!confirm(`Eliminar todas las experiencias en "${inst}"?`)) return
    const ids = experiencias.filter((e) => e.institucion === inst).map((e) => e.id)
    for (const id of ids) {
      await supabase.from('experiencias').delete().eq('id', id)
    }
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

  // Agrupar experiencias por institución para mostrar en la lista
  const grouped: { institucion: string; items: Experiencia[] }[] = []
  experiencias.forEach((exp) => {
    const existing = grouped.find((g) => g.institucion === exp.institucion)
    if (existing) {
      existing.items.push(exp)
    } else {
      grouped.push({ institucion: exp.institucion, items: [exp] })
    }
  })

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
            <input
              type="text"
              value={institucion}
              onChange={(e) => setInstitucion(e.target.value)}
              required
              placeholder="Ej: Programa de Alimentacion Escolar PAE - MIDIS"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none"
            />
          </div>

          {/* Cargos */}
          <div className="space-y-6">
            {cargos.map((cargo, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#1B4F72]">Cargo {idx + 1}</h3>
                  {cargos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCargo(idx)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Quitar cargo
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio (MM/YYYY)</label>
                      <input type="text" value={cargo.fecha_inicio} onChange={(e) => updateCargo(idx, 'fecha_inicio', e.target.value)} placeholder="06/2022" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin</label>
                      <input type="text" value={cargo.fecha_fin} onChange={(e) => updateCargo(idx, 'fecha_fin', e.target.value)} placeholder="Actualidad" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                    <input type="text" value={cargo.cargo} onChange={(e) => updateCargo(idx, 'cargo', e.target.value)} required placeholder="Ej: Jefe de la Unidad de Tecnología" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Funciones (una por línea)</label>
                    <textarea value={cargo.funciones} onChange={(e) => updateCargo(idx, 'funciones', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Logros (opcional, uno por línea)</label>
                    <textarea value={cargo.logros} onChange={(e) => updateCargo(idx, 'logros', e.target.value)} rows={2} placeholder="Ej: Implementacion del Sistema de Gestion Documental" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reconocimientos (opcional)</label>
                    <textarea value={cargo.reconocimientos} onChange={(e) => updateCargo(idx, 'reconocimientos', e.target.value)} rows={2} placeholder="Titulo - URL (uno por línea)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Proyectos principales (opcional)</label>
                    <textarea value={cargo.proyectos} onChange={(e) => updateCargo(idx, 'proyectos', e.target.value)} rows={2} placeholder="Uno por línea" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón agregar cargo */}
          <button
            type="button"
            onClick={addCargo}
            className="flex items-center gap-2 text-sm text-[#1B4F72] font-medium hover:text-[#2E86C1] border border-dashed border-[#1B4F72]/30 rounded-md px-4 py-2 hover:border-[#2E86C1] transition-colors w-full justify-center"
          >
            <Plus size={14} /> Agregar otro cargo en esta institución
          </button>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex items-center gap-2 bg-[#1B4F72] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2E86C1] min-h-[44px]">
              <Save size={16} /> {editingInstitucion ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" onClick={resetForm} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm hover:bg-gray-50 min-h-[44px]">
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {grouped.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg mb-2">No hay experiencias registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.institucion} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Header de la institución */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="font-bold text-[#1B4F72]">{group.institucion}</p>
                  <p className="text-xs text-gray-500">{group.items.length} cargo{group.items.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEditGroup(group.institucion)} className="p-2 hover:bg-gray-200 rounded" title="Editar todos los cargos">
                    <Edit2 size={16} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDeleteGroup(group.institucion)} className="p-2 hover:bg-red-50 rounded" title="Eliminar institución">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* Lista de cargos */}
              <div className="divide-y divide-gray-100">
                {group.items.map((exp) => (
                  <div key={exp.id} className={`px-4 py-3 ${!exp.visible ? 'opacity-50' : ''}`}>
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
                        <p className="font-medium text-gray-800 text-sm">{exp.cargo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{Array.isArray(exp.funciones) ? exp.funciones.length : 0} funciones</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className={`p-1.5 hover:bg-blue-50 rounded cursor-pointer ${uploading ? 'opacity-50' : ''}`} title="Subir sustento">
                          <Upload size={14} className="text-blue-500" />
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(exp.id, e.target.files[0]) }} />
                        </label>
                        {exp.archivo_url && (
                          <a href={exp.archivo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded" title="Ver sustento">
                            <FileText size={14} className="text-green-500" />
                          </a>
                        )}
                        <button onClick={() => toggleVisible(exp)} className="p-1.5 hover:bg-gray-100 rounded" title={exp.visible ? 'Ocultar' : 'Mostrar'}>
                          {exp.visible ? <Eye size={14} className="text-gray-500" /> : <EyeOff size={14} className="text-orange-500" />}
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 hover:bg-red-50 rounded" title="Eliminar cargo">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
