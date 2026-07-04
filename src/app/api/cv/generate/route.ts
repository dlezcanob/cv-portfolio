/**
 * POST /api/cv/generate
 *
 * Genera el PDF del CV usando Puppeteer.
 * Soporta modo simple (solo trayectoria) y documentado (+ certificados con watermark).
 */

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel: 60s para generación de PDF

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { getCvData } from '@/lib/data'
import { generateCvHtml } from '@/lib/cv-template'
import type { PdfGenerationOptions } from '@/lib/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parsear opciones del body
    let options: PdfGenerationOptions = { mode: 'simple' }
    try {
      const body = await request.json()
      options = {
        mode: body.mode || 'simple',
        empresa: body.empresa || undefined,
      }
    } catch {
      // Si no hay body, usar defaults
    }

    // 2. Obtener datos del CV desde Supabase
    const cvData = await getCvData()
    if (!cvData.perfil) {
      return NextResponse.json(
        { error: 'No se encontró información del perfil' },
        { status: 404 }
      )
    }

    // 3. Generar HTML del CV
    const html = generateCvHtml(cvData)

    // 4. Renderizar HTML a PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const cvPdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '2.2cm', right: '2.5cm', bottom: '2cm', left: '2.5cm' },
      printBackground: true,
    })

    await browser.close()

    let finalPdfBuffer: Buffer = Buffer.from(cvPdfBuffer)

    // 5. Si modo documentado: anexar certificados
    if (options.mode === 'documentado') {
      finalPdfBuffer = await appendCertificates(
        finalPdfBuffer,
        cvData.certificaciones,
        options.empresa
      )
    }

    // 6. Retornar PDF
    const timestamp = new Date().toISOString().slice(0, 10)
    const modeLabel = options.mode === 'documentado' ? 'documentado' : ''
    const filename = `CV_David_Lezcano_${timestamp}${modeLabel ? '_' + modeLabel : ''}.pdf`

    return new NextResponse(new Uint8Array(finalPdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalPdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[CV Generator] Error:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}

/**
 * Anexa certificados PDF al CV y aplica watermark si hay empresa.
 */
async function appendCertificates(
  cvBuffer: Buffer,
  certificaciones: { nombre: string; archivo_url: string | null }[],
  empresa?: string
): Promise<Buffer> {
  const outputDoc = await PDFDocument.load(cvBuffer)
  const cvPageCount = outputDoc.getPageCount()

  for (const cert of certificaciones) {
    if (!cert.archivo_url) continue

    try {
      // Descargar el certificado
      const response = await fetch(cert.archivo_url)
      if (!response.ok) continue

      const certBuffer = await response.arrayBuffer()
      const certDoc = await PDFDocument.load(certBuffer)
      const pageIndices = Array.from(
        { length: certDoc.getPageCount() },
        (_, i) => i
      )
      const copiedPages = await outputDoc.copyPages(certDoc, pageIndices)

      for (const page of copiedPages) {
        outputDoc.addPage(page)
      }
    } catch {
      // Si falla un certificado, continuar con el siguiente
      continue
    }
  }

  // Aplicar watermark si hay empresa
  if (empresa && empresa.trim()) {
    const font = await outputDoc.embedFont(StandardFonts.Helvetica)
    const pages = outputDoc.getPages()
    const watermarkText = `Exclusivo para evaluación en ${empresa}`

    // Solo en páginas de certificados (después del CV)
    for (let i = cvPageCount; i < pages.length; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()

      page.drawText(watermarkText, {
        x: width / 2 - 150,
        y: height / 2,
        size: 36,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.12,
        rotate: degrees(45),
      })
    }
  }

  const pdfBytes = await outputDoc.save()
  return Buffer.from(pdfBytes)
}

/** GET - Genera PDF simple sin autenticación (para botón público) */
export async function GET(): Promise<NextResponse> {
  const fakeRequest = new NextRequest('http://localhost/api/cv/generate', {
    method: 'POST',
    body: JSON.stringify({ mode: 'simple' }),
  })
  return POST(fakeRequest)
}
