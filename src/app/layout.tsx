import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'David Lezcano Balarezo | Portfolio Profesional',
  description: 'Ingeniero Empresarial y de Sistema. +20 años de experiencia en gestión de proyectos TI, transformación digital y gobierno corporativo. PMP, ITIL, Scrum Master.',
  metadataBase: new URL('https://davidlezcano.vercel.app'),
  openGraph: {
    title: 'David Lezcano Balarezo | Portfolio Profesional',
    description: 'Ingeniero con +20 años liderando proyectos de transformación digital, gobierno corporativo y gestión de TI.',
    type: 'website',
    url: 'https://davidlezcano.vercel.app',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'David Lezcano Balarezo - Portfolio Profesional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'David Lezcano Balarezo | Portfolio Profesional',
    description: 'Ingeniero con +20 años liderando proyectos de transformación digital.',
    images: ['/opengraph-image'],
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
