/**
 * Dashboard del admin panel.
 * Muestra resumen de contenido y accesos rápidos.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Briefcase, GraduationCap, Award } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createServerSupabaseClient()

  const [expCount, eduCount, certCount] = await Promise.all([
    supabase.from('experiencias').select('id', { count: 'exact', head: true }),
    supabase.from('educacion').select('id', { count: 'exact', head: true }),
    supabase.from('certificaciones').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Experiencias', count: expCount.count || 0, icon: Briefcase, href: '/admin/experiencias' },
    { label: 'Educación', count: eduCount.count || 0, icon: GraduationCap, href: '/admin/educacion' },
    { label: 'Certificaciones', count: certCount.count || 0, icon: Award, href: '/admin/certificaciones' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
          >
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

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/experiencias"
            className="px-4 py-2 bg-[#1B4F72] text-white rounded-md text-sm font-medium hover:bg-[#2E86C1] transition-colors"
          >
            + Agregar experiencia
          </Link>
          <Link
            href="/admin/generar-pdf"
            className="px-4 py-2 border border-[#1B4F72] text-[#1B4F72] rounded-md text-sm font-medium hover:bg-[#1B4F72]/5 transition-colors"
          >
            Generar CV Documentado
          </Link>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ver portafolio público
          </Link>
        </div>
      </div>
    </div>
  )
}
