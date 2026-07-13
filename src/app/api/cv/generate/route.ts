export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, degrees, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BLUE = rgb(0.267, 0.447, 0.769);
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(0.35, 0.35, 0.35);
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 72;
const MARGIN_RIGHT = 72;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

interface DrawContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  fontBold: PDFFont;
}

function newPage(ctx: DrawContext): PDFPage {
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.page = page;
  ctx.y = PAGE_HEIGHT - MARGIN_TOP;
  return page;
}

function checkNewPage(ctx: DrawContext, needed: number): void {
  if (ctx.y - needed < MARGIN_BOTTOM) {
    newPage(ctx);
  }
}

function drawText(ctx: DrawContext, text: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; maxWidth?: number }) {
  const size = options.size || 10;
  const font = options.font || ctx.font;
  const color = options.color || BLACK;
  const indent = options.indent || 0;
  const maxWidth = options.maxWidth || (CONTENT_WIDTH - indent);

  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];

  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  for (const l of lines) {
    checkNewPage(ctx, size + 4);
    ctx.page.drawText(l, {
      x: MARGIN_LEFT + indent,
      y: ctx.y,
      size,
      font,
      color,
    });
    ctx.y -= size + 4;
  }
}

function drawLine(ctx: DrawContext) {
  checkNewPage(ctx, 10);
  ctx.page.drawLine({
    start: { x: MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: ctx.y },
    thickness: 1.5,
    color: BLUE,
  });
  ctx.y -= 12;
}

function drawSectionTitle(ctx: DrawContext, title: string) {
  ctx.y -= 10;
  checkNewPage(ctx, 30);
  const titleWidth = ctx.fontBold.widthOfTextAtSize(title, 14);
  const centerX = MARGIN_LEFT + (CONTENT_WIDTH - titleWidth) / 2;
  ctx.page.drawText(title, {
    x: centerX,
    y: ctx.y,
    size: 14,
    font: ctx.fontBold,
    color: BLUE,
  });
  ctx.y -= 4;
  ctx.page.drawLine({
    start: { x: centerX, y: ctx.y },
    end: { x: centerX + titleWidth, y: ctx.y },
    thickness: 1,
    color: BLUE,
  });
  ctx.y -= 18;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let mode = 'simple';
    let empresa = '';
    try {
      const body = await request.json();
      mode = body.mode || 'simple';
      empresa = body.empresa || '';
    } catch {}

    const supabase = createServerSupabaseClient();

    const { data: perfil } = await supabase.from('perfil').select('*').single();
    if (!perfil) return NextResponse.json({ error: 'No hay perfil configurado' }, { status: 400 });

    const { data: experiencias } = await supabase.from('experiencias').select('*').eq('visible', true).order('orden');
    const { data: educacion } = await supabase.from('educacion').select('*').eq('visible', true).order('orden');
    const { data: certificaciones } = await supabase.from('certificaciones').select('*').eq('visible', true).order('orden');

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const ctx: DrawContext = { doc, page: null as unknown as PDFPage, y: 0, font, fontBold };
    newPage(ctx);

    // === HEADER ===
    // Foto (si existe) - arriba a la derecha
    if (perfil.foto_url) {
      try {
        const fotoRes = await fetch(perfil.foto_url);
        if (fotoRes.ok) {
          const fotoBuffer = await fotoRes.arrayBuffer();
          const contentType = fotoRes.headers.get('content-type') || '';
          const fotoImage = contentType.includes('png')
            ? await doc.embedPng(fotoBuffer)
            : await doc.embedJpg(fotoBuffer);
          const fotoDims = fotoImage.scale(1);
          const fotoScale = Math.min(75 / fotoDims.width, 100 / fotoDims.height);
          const fotoW = fotoDims.width * fotoScale;
          const fotoH = fotoDims.height * fotoScale;
          ctx.page.drawImage(fotoImage, {
            x: PAGE_WIDTH - MARGIN_RIGHT - fotoW,
            y: PAGE_HEIGHT - MARGIN_TOP - fotoH,
            width: fotoW,
            height: fotoH,
          });
        }
      } catch {
        // Si falla la foto, continuar sin ella
      }
    }

    drawText(ctx, perfil.telefono + '  |  ' + perfil.email, { size: 9, color: GRAY });
    ctx.y -= 2;
    if (perfil.linkedin_url) {
      drawText(ctx, perfil.linkedin_url, { size: 8, color: BLUE });
    }
    ctx.y -= 14;

    drawText(ctx, perfil.nombre_completo, { size: 18, font: fontBold });
    ctx.y -= 4;

    drawLine(ctx);
    ctx.y -= 6;

    drawText(ctx, perfil.titulo_profesional + '.', { size: 10, font: fontBold });
    ctx.y -= 4;
    drawText(ctx, perfil.resumen, { size: 10, color: GRAY });
    ctx.y -= 8;

    drawText(ctx, 'Certificaciones principales en:', { size: 10 });
    ctx.y -= 2;
    if (certificaciones) {
      for (const cert of certificaciones) {
        const text = cert.codigo ? cert.nombre + ' ' + cert.codigo : cert.nombre;
        drawText(ctx, '- ' + text, { size: 10, indent: 10 });
      }
    }
    ctx.y -= 6;

    // === EXPERIENCIA ===
    drawSectionTitle(ctx, 'Experiencia');

    if (experiencias) {
      for (const exp of experiencias) {
        checkNewPage(ctx, 60);
        drawText(ctx, exp.fecha_inicio + ' - ' + exp.fecha_fin, { size: 10, font: fontBold });
        drawText(ctx, exp.institucion, { size: 10, font: fontBold });
        drawText(ctx, exp.cargo, { size: 10, font: fontBold });
        ctx.y -= 2;

        const funciones = Array.isArray(exp.funciones) ? exp.funciones : [];
        if (funciones.length > 0) {
          drawText(ctx, 'Funciones asignadas:', { size: 9, font: fontBold });
          ctx.y -= 1;
          for (const f of funciones) {
            drawText(ctx, '>  ' + f, { size: 9, indent: 14, color: GRAY });
          }
        }

        const logros = Array.isArray(exp.logros) ? exp.logros : [];
        if (logros.length > 0) {
          ctx.y -= 4;
          drawText(ctx, 'Logros:', { size: 9, font: fontBold, indent: 14 });
          for (const l of logros) {
            drawText(ctx, l, { size: 9, indent: 20, color: GRAY });
          }
        }

        const proyectos = Array.isArray(exp.proyectos) ? exp.proyectos : [];
        if (proyectos.length > 0) {
          ctx.y -= 4;
          drawText(ctx, 'Proyectos principales:', { size: 9, font: fontBold, indent: 14 });
          proyectos.forEach((p: string, i: number) => {
            drawText(ctx, (i + 1) + '. ' + p, { size: 9, indent: 20, color: GRAY });
          });
        }

        ctx.y -= 12;
      }
    }

    // === EDUCACION ===
    if (educacion && educacion.length > 0) {
      drawSectionTitle(ctx, 'Formacion');
      for (const edu of educacion) {
        checkNewPage(ctx, 30);
        drawText(ctx, edu.fecha_inicio + ' - ' + edu.fecha_fin, { size: 10, font: fontBold });
        drawText(ctx, edu.institucion, { size: 10, font: fontBold });
        drawText(ctx, edu.titulo, { size: 10, color: GRAY });
        ctx.y -= 8;
      }
    }

    // === MODO DOCUMENTADO ===
    if (mode === 'documentado') {
      const cvPageCount = doc.getPageCount();

      const archivos: { url: string }[] = [];
      if (experiencias) {
        for (const e of experiencias) { if (e.archivo_url) archivos.push({ url: e.archivo_url }); }
      }
      if (educacion) {
        for (const e of educacion) { if (e.archivo_url) archivos.push({ url: e.archivo_url }); }
      }
      if (certificaciones) {
        for (const c of certificaciones) { if (c.archivo_url) archivos.push({ url: c.archivo_url }); }
      }

      for (const archivo of archivos) {
        try {
          const response = await fetch(archivo.url);
          if (!response.ok) continue;
          const buffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || '';

          if (contentType.includes('pdf')) {
            const sourceDoc = await PDFDocument.load(buffer);
            const pages = await doc.copyPages(sourceDoc, sourceDoc.getPageIndices());
            for (const page of pages) { doc.addPage(page); }
          } else if (contentType.includes('image')) {
            const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            const image = contentType.includes('png')
              ? await doc.embedPng(buffer)
              : await doc.embedJpg(buffer);
            const dims = image.scale(1);
            const scale = Math.min(500 / dims.width, 720 / dims.height, 1);
            const w = dims.width * scale;
            const h = dims.height * scale;
            page.drawImage(image, { x: (PAGE_WIDTH - w) / 2, y: (PAGE_HEIGHT - h) / 2, width: w, height: h });
          }
        } catch { continue; }
      }

      if (empresa && empresa.trim()) {
        const wFont = await doc.embedFont(StandardFonts.Helvetica);
        const pages = doc.getPages();
        const watermarkText = 'Exclusivo para evaluacion en ' + empresa;
        for (let i = cvPageCount; i < pages.length; i++) {
          const pg = pages[i];
          const { width, height } = pg.getSize();
          pg.drawText(watermarkText, {
            x: width / 2 - 170,
            y: height / 2,
            size: 30,
            font: wFont,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.12,
            rotate: degrees(45),
          });
        }
      }
    }

    const pdfBytes = await doc.save();
    const finalBuffer = Buffer.from(pdfBytes);
    const modeLabel = mode === 'documentado' ? '_documentado' : '';
    const filename = 'CV_David_Lezcano_' + new Date().toISOString().slice(0, 10) + modeLabel + '.pdf';

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        'Content-Length': finalBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[CV Generator]', error);
    return NextResponse.json({ error: 'Error: ' + (error instanceof Error ? error.message : 'desconocido') }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  const url = new URL('/api/cv/generate', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return POST(new NextRequest(url, { method: 'POST', body: JSON.stringify({ mode: 'simple' }) }));
}
