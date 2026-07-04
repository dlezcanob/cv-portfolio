import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'David Lezcano Balarezo | Portfolio Profesional',
  description: 'Ingeniero Empresarial y de Sistema. +20 años de experiencia en gestión de proyectos TI, transformación digital y gobierno corporativo. PMP, ITIL, Scrum Master.',
  openGraph: {
    title: 'David Lezcano Balarezo | Portfolio Profesional',
    description: 'Ingeniero con +20 años liderando proyectos de transformación digital.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
