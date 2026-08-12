'use client'

/**
 * Página para restablecer la contraseña.
 * El usuario llega aquí desde el enlace enviado por email.
 * Supabase Auth inyecta el token en el hash de la URL automáticamente.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase maneja el token del hash de la URL automáticamente
    // cuando se usa el cliente del navegador. Solo verificamos que haya sesión.
    const supabase = createClient()

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // También verificar si ya hay sesión activa (el usuario puede haber llegado directamente)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        // Dar un momento para que Supabase procese el hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
              setSessionReady(true)
            } else {
              setSessionError(true)
            }
          })
        }, 2000)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError('Error al actualizar la contraseña. El enlace puede haber expirado. Solicita uno nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirigir al admin después de 3 segundos
    setTimeout(() => {
      router.push('/admin')
    }, 3000)
  }

  if (sessionError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Enlace inválido o expirado
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.
          </p>
          <Link
            href="/login/forgot-password"
            className="inline-flex items-center justify-center gap-2 bg-[#1B4F72] text-white py-2.5 px-4 rounded-md font-medium hover:bg-[#2E86C1] transition-colors text-sm min-h-[44px]"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Contraseña actualizada
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Tu contraseña se ha restablecido correctamente. Serás redirigido al panel de administración.
          </p>
          <Link
            href="/admin"
            className="text-sm text-[#1B4F72] hover:underline"
          >
            Ir al admin ahora
          </Link>
        </div>
      </main>
    )
  }

  if (!sessionReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 size={32} className="mx-auto text-[#1B4F72] animate-spin mb-4" />
          <p className="text-sm text-gray-600">Verificando enlace de recuperación...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-center text-[#1B4F72] mb-2">
          Nueva contraseña
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B4F72] text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B4F72] text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1B4F72] text-white py-2.5 rounded-md font-medium hover:bg-[#2E86C1] transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </main>
  )
}
