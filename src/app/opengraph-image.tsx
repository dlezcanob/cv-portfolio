/**
 * Open Graph Image generada dinámicamente.
 * Se usa como preview al compartir el link en WhatsApp, LinkedIn, etc.
 */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'David Lezcano Balarezo - Portfolio Profesional'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Iniciales */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '140px',
            height: '140px',
            borderRadius: '70px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '3px solid rgba(255, 255, 255, 0.4)',
            marginBottom: '30px',
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: 'bold', color: 'white' }}>
            DLB
          </span>
        </div>

        {/* Nombre */}
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 12px 0',
            textAlign: 'center',
          }}
        >
          David Lezcano Balarezo
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: '0 0 24px 0',
            textAlign: 'center',
          }}
        >
          Ingeniero Empresarial y de Sistema | PMP | ITIL | Scrum Master
        </p>

        {/* Línea decorativa */}
        <div
          style={{
            width: '80px',
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '2px',
            marginBottom: '20px',
          }}
        />

        {/* Descripción */}
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          +20 años liderando proyectos de transformación digital y gestión de TI
        </p>
      </div>
    ),
    { ...size }
  )
}
