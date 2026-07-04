'use client'

/**
 * Botón de descarga de CV en PDF.
 * Componente cliente porque necesita manejar el click y la descarga.
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export function DownloadButton() {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'simple' }),
      })

      if (!response.ok) {
        throw new Error('Error al generar el PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CV_David_Lezcano_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error descargando CV:', error)
      alert('Error al generar el PDF. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 bg-white text-[#1B4F72] font-medium px-5 py-3 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 min-h-[44px]"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Download size={18} />
      )}
      {loading ? 'Generando...' : 'Descargar CV'}
    </button>
  )
}
