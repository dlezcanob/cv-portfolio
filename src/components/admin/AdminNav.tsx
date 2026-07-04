'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, GraduationCap, Award, LogOut, FileDown } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/experiencias', label: 'Experiencias', icon: Briefcase },
  { href: '/admin/educacion', label: 'Educación', icon: GraduationCap },
  { href: '/admin/certificaciones', label: 'Certificaciones', icon: Award },
  { href: '/admin/generar-pdf', label: 'Generar PDF', icon: FileDown },
]

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1B4F72] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">{email}</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-2 py-1"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
