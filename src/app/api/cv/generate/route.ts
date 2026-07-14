export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, degrees, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BLUE = rgb(0.267, 0.447, 0.769);
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(0.35, 0.35, 0.35);
const WHITE = rgb(1, 1, 1);
const LINKEDIN_BLUE = rgb(0, 0.467, 0.706);
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

  for (let li = 0; li < lines.length; li++) {
    const l = lines[li];
    checkNewPage(ctx, size + 4);
    const isLast = li === lines.length - 1;
    if (!isLast && lines.length > 1) {
      const ws = l.split(' ');
      if (ws.length > 1) {
        const tw = ws.reduce((s: number, w: string) => s + font.widthOfTextAtSize(w, size), 0);
        const sp = (maxWidth - tw) / (ws.length - 1);
        let xp = MARGIN_LEFT + indent;
        for (const w of ws) { ctx.page.drawText(w, { x: xp, y: ctx.y, size, font, color }); xp += font.widthOfTextAtSize(w, size) + sp; }
      } else { ctx.page.drawText(l, { x: MARGIN_LEFT + indent, y: ctx.y, size, font, color }); }
    } else { ctx.page.drawText(l, { x: MARGIN_LEFT + indent, y: ctx.y, size, font, color }); }
    ctx.y -= size + 4;
  }
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

function drawIcon(page: PDFPage, x: number, y: number, letter: string, bgColor: ReturnType<typeof rgb>, font: PDFFont) {
  const r = 7;
  page.drawCircle({ x: x + r, y: y, size: r, color: bgColor });
  const letterWidth = font.widthOfTextAtSize(letter, 7);
  page.drawText(letter, { x: x + r - letterWidth / 2, y: y - 3, size: 7, font, color: WHITE });
  return x + r * 2 + 6;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let mode = 'simple';
    let empresa = '';
  let usarTachado = false;
    try {
      const body = await request.json();
      mode = body.mode || 'simple';
      empresa = body.empresa || '';
      usarTachado = body.usarTachado || false;
    } catch {}

    const supabase = createServerSupabaseClient();

    const { data: perfil } = await supabase.from('perfil').select('*').single();
    if (!perfil) return NextResponse.json({ error: 'No hay perfil configurado' }, { status: 400 });

    const { data: experiencias } = await supabase.from('experiencias').select('*').eq('visible', true).order('orden');
    const { data: educacion } = await supabase.from('educacion').select('*').eq('visible', true).order('orden');
    const { data: certificaciones } = await supabase.from('certificaciones').select('*').eq('visible', true).order('orden');

    const sortedExp = (experiencias || []).sort((a, b) => {
      if (a.fecha_fin === 'Actualidad' && b.fecha_fin !== 'Actualidad') return -1;
      if (b.fecha_fin === 'Actualidad' && a.fecha_fin !== 'Actualidad') return 1;
      const parseDate = (d: string) => { const [m, y] = d.split('/'); return parseInt(y) * 12 + parseInt(m); };
      return parseDate(b.fecha_inicio) - parseDate(a.fecha_inicio);
    });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const ctx: DrawContext = { doc, page: null as unknown as PDFPage, y: 0, font, fontBold };
    newPage(ctx);

    // === HEADER ===
    const headerTop = PAGE_HEIGHT - MARGIN_TOP;
    const textLeftX = MARGIN_LEFT;
    const fotoW = 80;
    const fotoH = 100;
    const fotoX = PAGE_WIDTH - MARGIN_RIGHT - fotoW;
    const fotoY = headerTop - fotoH;

    if (perfil.foto_url) {
      try {
        const fotoRes = await fetch(perfil.foto_url);
        if (fotoRes.ok) {
          const fotoBuffer = await fotoRes.arrayBuffer();
          const contentType = fotoRes.headers.get('content-type') || '';
          const fotoImage = contentType.includes('png')
            ? await doc.embedPng(fotoBuffer)
            : await doc.embedJpg(fotoBuffer);
          ctx.page.drawImage(fotoImage, {
            x: fotoX,
            y: fotoY,
            width: fotoW,
            height: fotoH,
          });
        }
      } catch {}
    }

    let yPos = headerTop - 14;

    let afterIcon = drawIcon(ctx.page, textLeftX, yPos, 'C', rgb(0.2, 0.6, 0.4), fontBold);
    ctx.page.drawText(perfil.telefono, { x: afterIcon, y: yPos - 3, size: 9, font, color: BLACK });
    yPos -= 18;

    afterIcon = drawIcon(ctx.page, textLeftX, yPos, '@', BLUE, font);
    ctx.page.drawText(perfil.email, { x: afterIcon, y: yPos - 3, size: 9, font, color: BLUE });
    yPos -= 18;

    if (perfil.linkedin_url) {
      afterIcon = drawIcon(ctx.page, textLeftX, yPos, 'in', LINKEDIN_BLUE, fontBold);
      ctx.page.drawText(perfil.linkedin_url, { x: afterIcon, y: yPos - 3, size: 7, font, color: BLUE });
      yPos -= 18;
    }

    yPos -= 12;

    ctx.page.drawText(perfil.nombre_completo, { x: textLeftX, y: yPos, size: 20, font: fontBold, color: BLACK });
    yPos -= 30;

    const lineEndX = fotoX - 10;
    ctx.page.drawLine({
      start: { x: MARGIN_LEFT, y: yPos },
      end: { x: lineEndX, y: yPos },
      thickness: 2,
      color: BLUE,
    });
    yPos -= 18;

    const belowFoto = fotoY - 14;
    ctx.y = Math.min(yPos, belowFoto);

    // === Titulo + Resumen ===
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

    for (const exp of sortedExp) {
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
          checkNewPage(ctx, 14);
          ctx.page.drawText('>', { x: MARGIN_LEFT + 30, y: ctx.y, size: 9, font: ctx.font, color: GRAY });
          drawText(ctx, f, { size: 9, indent: 42, color: GRAY });
        }
      }

      const logros = Array.isArray(exp.logros) ? exp.logros : [];
      if (logros.length > 0) {
        ctx.y -= 4;
        drawText(ctx, 'Logros:', { size: 9, font: fontBold, indent: 30 });
        for (const l of logros) {
          drawText(ctx, l, { size: 9, indent: 36, color: GRAY });
        }
      }

      const reconocimientos = Array.isArray(exp.reconocimientos) ? exp.reconocimientos : [];
      if (reconocimientos.length > 0) {
        ctx.y -= 4;
        drawText(ctx, 'Reconocimientos:', { size: 9, font: fontBold, indent: 30 });
        for (const r of reconocimientos) {
          const rObj = r as { titulo: string; url?: string };
          if (rObj.url) {
            drawText(ctx, rObj.titulo, { size: 9, indent: 36, color: GRAY });
            drawText(ctx, rObj.url, { size: 8, indent: 36, color: BLUE });
          } else {
            drawText(ctx, rObj.titulo, { size: 9, indent: 36, color: GRAY });
          }
        }
      }

      const proyectos = Array.isArray(exp.proyectos) ? exp.proyectos : [];
      if (proyectos.length > 0) {
        ctx.y -= 4;
        drawText(ctx, 'Proyectos principales:', { size: 9, font: fontBold, indent: 30 });
        proyectos.forEach((p: string, i: number) => {
          drawText(ctx, (i + 1) + '. ' + p, { size: 9, indent: 36, color: GRAY });
        });
      }

      ctx.y -= 12;
    }

    // === EDUCACION ===
    if (educacion && educacion.length > 0) {
      drawSectionTitle(ctx, 'Formacion');
      const grados = educacion.filter((e: { tipo?: string }) => e.tipo !== 'curso');
      const cursos = educacion.filter((e: { tipo?: string }) => e.tipo === 'curso');
      for (const edu of grados) {
        checkNewPage(ctx, 30);
        drawText(ctx, edu.fecha_inicio + ' - ' + edu.fecha_fin, { size: 10, font: fontBold });
        drawText(ctx, edu.institucion, { size: 10, font: fontBold });
        drawText(ctx, edu.titulo, { size: 10, color: GRAY });
        ctx.y -= 8;
      }
      if (cursos.length > 0) {
        ctx.y -= 6;
        for (const cur of cursos) {
          checkNewPage(ctx, 14);
          ctx.page.drawText(cur.fecha_inicio, { x: MARGIN_LEFT, y: ctx.y, size: 9, font, color: BLACK });
          ctx.page.drawText(cur.institucion, { x: MARGIN_LEFT + 100, y: ctx.y, size: 9, font, color: BLACK });
          ctx.page.drawText(cur.titulo, { x: MARGIN_LEFT + 240, y: ctx.y, size: 9, font: fontBold, color: BLACK });
          ctx.y -= 13;
        }
      }
    }
	
    // === REFERENCIAS ===
    const { data: referencias } = await supabase.from('referencias').select('*').eq('visible', true).order('orden');
    if (referencias && referencias.length > 0) {
      drawSectionTitle(ctx, 'Referencias');
      for (const ref of referencias) {
        checkNewPage(ctx, 14);
        ctx.page.drawText(ref.nombre, { x: MARGIN_LEFT, y: ctx.y, size: 9, font: fontBold, color: BLACK });
        ctx.page.drawText(ref.telefono, { x: MARGIN_LEFT + 150, y: ctx.y, size: 9, font, color: BLACK });
        ctx.page.drawText(ref.cargo_empresa, { x: MARGIN_LEFT + 240, y: ctx.y, size: 9, font, color: GRAY });
        ctx.y -= 13;
      }
    }

    // === MODO DOCUMENTADO ===
    if (mode === 'documentado') {
      const cvPageCount = doc.getPageCount();

      const archivos: { url: string }[] = [];
      if (experiencias) {
        for (const e of experiencias) {
          const url = usarTachado && e.archivo_tachado_url ? e.archivo_tachado_url : e.archivo_url;
          if (url) archivos.push({ url });
        }
      }
      if (educacion) {
        for (const e of educacion) {
          const url = usarTachado && e.archivo_tachado_url ? e.archivo_tachado_url : e.archivo_url;
          if (url) archivos.push({ url });
        }
      }
      if (certificaciones) {
        for (const c of certificaciones) {
          const url = usarTachado && c.archivo_tachado_url ? c.archivo_tachado_url : c.archivo_url;
          if (url) archivos.push({ url });
        }
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
        const wFont = await doc.embedFont(StandardFonts.HelveticaBold);
        const pages = doc.getPages();
        const watermarkText = 'Exclusivo para evaluacion en ' + empresa;
        for (let i = cvPageCount; i < pages.length; i++) {
          const pg = pages[i];
          const { width, height } = pg.getSize();
          for (let row = -200; row < height + 200; row += 120) {
            for (let col = -400; col < width + 400; col += 500) {
              pg.drawText(watermarkText, {
                x: col,
                y: row,
                size: 38,
                font: wFont,
                color: rgb(0.6, 0.6, 0.6),
                opacity: 0.18,
                rotate: degrees(45),
              });
            }
          }
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

