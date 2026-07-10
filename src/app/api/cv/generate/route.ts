export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    // 1. Obtener el CV base (PDF de trayectoria subido por el admin)
    const { data: perfil } = await supabase.from('perfil').select('cv_base_url').single();

    if (!perfil?.cv_base_url) {
      return NextResponse.json(
        { error: 'No hay CV base subido. Ve al admin y sube tu CV de trayectoria.' },
        { status: 400 }
      );
    }

    // 2. Descargar el CV base
    const cvResponse = await fetch(perfil.cv_base_url);
    if (!cvResponse.ok) {
      return NextResponse.json({ error: 'No se pudo descargar el CV base.' }, { status: 500 });
    }
    const cvBuffer = Buffer.from(await cvResponse.arrayBuffer());

    // 3. Si es modo simple, devolver el CV base tal cual
    if (mode === 'simple') {
      const filename = `CV_David_Lezcano_${new Date().toISOString().slice(0, 10)}.pdf`;
      return new NextResponse(new Uint8Array(cvBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': cvBuffer.length.toString(),
        },
      });
    }

    // 4. Modo documentado: unir CV base + certificados
    const { data: certificaciones } = await supabase
      .from('certificaciones')
      .select('nombre, archivo_url, orden')
      .eq('visible', true)
      .not('archivo_url', 'is', null)
      .order('orden', { ascending: true });

    const { data: experiencias } = await supabase
      .from('experiencias')
      .select('institucion, archivo_url, orden')
      .eq('visible', true)
      .not('archivo_url', 'is', null)
      .order('orden', { ascending: true });

    const { data: educacionData } = await supabase
      .from('educacion')
      .select('titulo, archivo_url, orden')
      .eq('visible', true)
      .not('archivo_url', 'is', null)
      .order('orden', { ascending: true });

    // Unir todos los archivos de sustento en un solo array ordenado
    const archivos: { nombre: string; url: string }[] = [];

    if (experiencias) {
      for (const exp of experiencias) {
        if (exp.archivo_url) archivos.push({ nombre: exp.institucion, url: exp.archivo_url });
      }
    }
    if (educacionData) {
      for (const edu of educacionData) {
        if (edu.archivo_url) archivos.push({ nombre: edu.titulo, url: edu.archivo_url });
      }
    }
    if (certificaciones) {
      for (const cert of certificaciones) {
        if (cert.archivo_url) archivos.push({ nombre: cert.nombre, url: cert.archivo_url });
      }
    }

    // 5. Construir el PDF final
    const outputDoc = await PDFDocument.load(cvBuffer);
    const cvPageCount = outputDoc.getPageCount();

    for (const archivo of archivos) {
      try {
        const response = await fetch(archivo.url);
        if (!response.ok) continue;
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('pdf')) {
          const sourceDoc = await PDFDocument.load(buffer);
          const pages = await outputDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
          for (const page of pages) {
            outputDoc.addPage(page);
          }
        } else if (contentType.includes('image')) {
          const page = outputDoc.addPage([595.28, 841.89]);
          let image;
          if (contentType.includes('png')) {
            image = await outputDoc.embedPng(buffer);
          } else {
            image = await outputDoc.embedJpg(buffer);
          }
          const dims = image.scale(1);
          const scale = Math.min(500 / dims.width, 750 / dims.height, 1);
          const w = dims.width * scale;
          const h = dims.height * scale;
          page.drawImage(image, {
            x: (595.28 - w) / 2,
            y: (841.89 - h) / 2,
            width: w,
            height: h,
          });
        }
      } catch {
        continue;
      }
    }

    // 6. Aplicar watermark en las paginas de certificados
    if (empresa && empresa.trim()) {
      const font = await outputDoc.embedFont(StandardFonts.Helvetica);
      const watermarkText = `Exclusivo para evaluacion en ${empresa}`;
      const pages = outputDoc.getPages();

      for (let i = cvPageCount; i < pages.length; i++) {
        const pg = pages[i];
        const { width, height } = pg.getSize();
        pg.drawText(watermarkText, {
          x: width / 2 - 180,
          y: height / 2,
          size: 32,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.12,
          rotate: degrees(45),
        });
      }
    }

    // 7. Guardar y retornar
    const pdfBytes = await outputDoc.save();
    const finalBuffer = Buffer.from(pdfBytes);
    const modeLabel = mode === 'documentado' ? '_documentado' : '';
    const filename = `CV_David_Lezcano_${new Date().toISOString().slice(0, 10)}${modeLabel}.pdf`;

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[CV Generator]', error);
    return NextResponse.json(
      { error: 'Error: ' + (error instanceof Error ? error.message : 'desconocido') },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const url = new URL('/api/cv/generate', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return POST(new NextRequest(url, { method: 'POST', body: JSON.stringify({ mode: 'simple' }) }));
}
