'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

export default function GenerarPdfPage() {
  const [mode, setMode] = useState<'simple' | 'documentado'>('documentado')
  const [empresa, setEmpresa] = useState('')
  const [usarTachado, setUsarTachado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          empresa: mode === 'documentado' ? empresa : undefined,
          usarTachado: mode === 'documentado' ? usarTachado : false,
        }),
      })

      if (!response.ok) throw new Error('Error generando PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const label = mode === 'documentado' ? 'documentado' : 'simple'
      a.download = `CV_David_Lezcano_${label}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al generar el PDF. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Generar PDF</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de CV</label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode('simple')}
              className={`flex-1 px-4 py-3 rounded-md border text-sm font-medium transition-colors ${
                mode === 'simple'
                  ? 'border-[#1B4F72] bg-[#1B4F72]/5 text-[#1B4F72]'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Simple
              <p className="text-xs font-normal mt-1 text-gray-500">Solo trayectoria</p>
            </button>
            <button
              onClick={() => setMode('documentado')}
              className={`flex-1 px-4 py-3 rounded-md border text-sm font-medium transition-colors ${
                mode === 'documentado'
                  ? 'border-[#1B4F72] bg-[#1B4F72]/5 text-[#1B4F72]'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Documentado
              <p className="text-xs font-normal mt-1 text-gray-500">Trayectoria + certificados</p>
            </button>
          </div>
        </div>

        {mode === 'documentado' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa destinataria (watermark)
              </label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ej: Ministerio de Economia y Finanzas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1B4F72] focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Se imprimira en diagonal en todas las paginas de certificados. Dejalo vacio para no aplicar.
              </p>
            </div>

            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarTachado}
                  onChange={(e) => setUsarTachado(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#1B4F72] focus:ring-[#1B4F72]"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Usar versiones con montos tachados</p>
                  <p className="text-xs text-gray-500">Para empresas nuevas o desconocidas. Oculta informacion sensible (sueldos, montos).</p>
                </div>
              </label>
            </div>
          </>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#1B4F72] text-white py-3 rounded-md font-medium hover:bg-[#2E86C1] transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
          {loading ? 'Generando PDF...' : 'Generar y Descargar PDF'}
        </button>
      </div>
    </div>
  )
}
