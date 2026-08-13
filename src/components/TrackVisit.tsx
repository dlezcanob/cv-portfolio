'use client'

/**
 * Componente invisible que registra una visita al montarse.
 * Se incluye en la página pública para trackear visitas.
 */

import { useEffect } from 'react'

export function TrackVisit() {
  useEffect(() => {
    fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagina: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {
      // Silenciar errores de tracking
    })
  }, [])

  return null
}
