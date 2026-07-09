export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { getCvData } from '@/lib/data';
import { generateCvHtml } from '@/lib/cv-template';
import type { PdfGenerationOptions } from '@/lib/types';

async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = (await import('puppeteer-core')).default;
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteerCore = (await import('puppeteer-core')).default;
    return puppeteerCore.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let options: PdfGenerationOptions = { mode: 'simple' };
    try {
      const body = await request.json();
      options = { mode: body.mode || 'simple', empresa: body.empresa || undefined };
    } catch {
      // Sin body, usar defaults
    }

    const cvData = await getCvData();
    if (!cvData.perfil) {
      return NextResponse.json({ error: 'No hay perfil' }, { status: 404 });
    }

    const html = generateCvHtml(cvData);
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const cvPdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '2.2cm', right: '2.5cm', bottom: '2cm', left: '2.5cm' },
      printBackground: true,
    });

    await browser.close();
    let finalPdfBuffer: Buffer = Buffer.from(cvPdfBuffer);

    if (options.mode === 'documentado') {
      finalPdfBuffer = await appendCertificates(
        finalPdfBuffer,
        cvData.certificaciones,
        options.empresa
      );
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const modeLabel = options.mode === 'documentado' ? '_documentado' : '';
    const filename = `CV_David_Lezcano_${timestamp}${modeLabel}.pdf`;

    return new NextResponse(new Uint8Array(finalPdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalPdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[CV Generator] Error:', error);
    const msg = error instanceof Error ? error.message : 'desconocido';
    return NextResponse.json({ error: 'Error al generar el PDF: ' + msg }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  const url = new URL('/api/cv/generate', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  const fakeRequest = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify({ mode: 'simple' }),
  });
  return POST(fakeRequest);
}

async function appendCertificates(
  cvBuffer: Buffer,
  certificaciones: { nombre: string; archivo_url: string | null }[],
  empresa?: string
): Promise<Buffer> {
  const outputDoc = await PDFDocument.load(cvBuffer);
  const cvPageCount = outputDoc.getPageCount();

  for (const cert of certificaciones) {
    if (!cert.archivo_url) continue;
    try {
      const response = await fetch(cert.archivo_url);
      if (!response.ok) continue;
      const certBuffer = await response.arrayBuffer();
      const certDoc = await PDFDocument.load(certBuffer);
      const pageIndices = Array.from({ length: certDoc.getPageCount() }, (_, i) => i);
      const copiedPages = await outputDoc.copyPages(certDoc, pageIndices);
      for (const p of copiedPages) {
        outputDoc.addPage(p);
      }
    } catch {
      continue;
    }
  }

  if (empresa && empresa.trim()) {
    const font = await outputDoc.embedFont(StandardFonts.Helvetica);
    const pages = outputDoc.getPages();
    const watermarkText = `Exclusivo para evaluacion en ${empresa}`;
    for (let i = cvPageCount; i < pages.length; i++) {
      const pg = pages[i];
      const { width, height } = pg.getSize();
      pg.drawText(watermarkText, {
        x: width / 2 - 150,
        y: height / 2,
        size: 36,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.12,
        rotate: degrees(45),
      });
    }
  }

  const pdfBytes = await outputDoc.save();
  return Buffer.from(pdfBytes);
}
