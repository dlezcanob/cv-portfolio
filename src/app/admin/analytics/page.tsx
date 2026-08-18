'use client'

/**
 * Dashboard de analytics interno.
 * Muestra visitas por día, visitantes únicos, y referrers.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Users, Eye, Globe, RefreshCw } from 'lucide-react'

interface Visita {
  id: string
  pagina: string
  referrer: string | null
  user_agent: string | null
  ip_hash: string | null
  created_at: string
}

interface DailyData {
  fecha: string
  visitas: number
  unicos: number
}

export default function AnalyticsPage() {
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7' | '30' | '90'>('30')
  const supabase = createClient()

  useEffect(() => {
    loadVisitas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  async function loadVisitas() {
    setLoading(true)
    const desde = new Date()
    desde.setDate(desde.getDate() - parseInt(periodo))

    const { data } = await supabase
      .from('visitas')
      .select('*')
      .gte('created_at', desde.toISOString())
      .order('created_at', { ascending: false })

    setVisitas((data || []) as Visita[])
    setLoading(false)
  }

  // Agrupar por día
  const dailyData: DailyData[] = (() => {
    const map = new Map<string, { visitas: number; ips: Set<string> }>()
    visitas.forEach((v) => {
      const fecha = v.created_at.split('T')[0]
      if (!map.has(fecha)) {
        map.set(fecha, { visitas: 0, ips: new Set() })
      }
      const day = map.get(fecha)!
      day.visitas++
      if (v.ip_hash) day.ips.add(v.ip_hash)
    })

    // Llenar días sin visitas
    const result: DailyData[] = []
    const hoy = new Date()
    for (let i = parseInt(periodo) - 1; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - i)
      const fecha = d.toISOString().split('T')[0]
      const day = map.get(fecha)
      result.push({
        fecha,
        visitas: day?.visitas || 0,
        unicos: day?.ips.size || 0,
      })
    }
    return result
  })()

  // Métricas resumen
  const totalVisitas = visitas.length
  const visitantesUnicos = new Set(visitas.map((v) => v.ip_hash).filter(Boolean)).size
  const promediodiario = totalVisitas > 0 ? (totalVisitas / parseInt(periodo)).toFixed(1) : '0'

  // Top referrers
  const referrers = (() => {
    const map = new Map<string, number>()
    visitas.forEach((v) => {
      const ref = v.referrer || 'Directo'
      map.set(ref, (map.get(ref) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  })()

  // Máximo para escalar la gráfica
  const maxVisitas = Math.max(...dailyData.map((d) => d.visitas), 1)

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando analytics...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 size={24} /> Analytics
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as '7' | '30' | '90')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
          <button
            onClick={loadVisitas}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            title="Refrescar"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Métricas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Eye size={16} /> Total visitas
          </div>
          <p className="text-3xl font-bold text-[#1B4F72]">{totalVisitas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users size={16} /> Visitantes únicos
          </div>
          <p className="text-3xl font-bold text-[#2E86C1]">{visitantesUnicos}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BarChart3 size={16} /> Promedio diario
          </div>
          <p className="text-3xl font-bold text-green-600">{promediodiario}</p>
        </div>
      </div>

      {/* Gráfica de barras */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Visitas por día</h2>
        <div className="relative h-48">
          <div className="absolute inset-0 flex items-end gap-1">
            {dailyData.map((day) => {
              const heightPct = maxVisitas > 0 ? (day.visitas / maxVisitas) * 100 : 0
              return (
                <div key={day.fecha} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {day.fecha}: {day.visitas} visitas, {day.unicos} únicos
                  </div>
                  {/* Valor encima de la barra */}
                  {day.visitas > 0 && (
                    <span className="text-[9px] text-gray-500 mb-0.5 hidden group-hover:block">{day.visitas}</span>
                  )}
                  {/* Barra */}
                  <div
                    className="w-full max-w-[32px] bg-[#1B4F72] rounded-t hover:bg-[#2E86C1] transition-colors cursor-pointer"
                    style={{ height: `${Math.max(heightPct, day.visitas > 0 ? 3 : 0)}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{dailyData[0]?.fecha}</span>
          <span>{dailyData[dailyData.length - 1]?.fecha}</span>
        </div>
      </div>

      {/* Top referrers */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
          <Globe size={16} /> Principales fuentes de tráfico
        </h2>
        {referrers.length === 0 ? (
          <p className="text-sm text-gray-400">Sin datos aún</p>
        ) : (
          <div className="space-y-3">
            {referrers.map(([source, count]) => (
              <div key={source} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate max-w-[300px]">{source}</span>
                    <span className="text-gray-500 font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#1B4F72] rounded-full h-2 transition-all"
                      style={{ width: `${(count / referrers[0][1]) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
