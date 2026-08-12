'use client'

/**
 * Página para solicitar reset de contraseña.
 * Envía un email con link para restablecer la contraseña usando Supabase Auth.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/login/reset-password`,
    })

    if (resetError) {
      setError('Error al enviar el correo. Verifica el email e intenta nuevamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Correo enviado
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Revisa tu bandeja de entrada en <strong>{email}</strong>. 
            Haz clic en el enlace del correo para restablecer tu contraseña.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#1B4F72] hover:underline"
          >
            <ArrowLeft size={14} />
            Volver al login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-center text-[#1B4F72] mb-2">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B4F72] text-sm"
              placeholder="david.lezcano@usil.pe"
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
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-[#1B4F72] hover:underline"
          >
            <ArrowLeft size={14} />
            Volver al login
          </Link>
        </div>
      </div>
    </main>
  )
}
