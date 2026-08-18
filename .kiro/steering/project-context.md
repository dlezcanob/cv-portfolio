# CV Portfolio Platform — Contexto del Proyecto

## Información General

- **Propietario:** David Lezcano Balarezo
- **URL producción:** https://davidlezcano.vercel.app
- **Repositorio:** https://github.com/dlezcanob/cv-portfolio
- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + pdf-lib
- **Hosting:** Vercel (free tier, deploy automático al pushear a main)

---

## Accesos a Servicios

| Servicio | Usuario | Dashboard |
|----------|---------|-----------|
| Vercel | david.lezcano@usil.pe | vercel.com |
| Supabase | Login con GitHub (dlezcanob) | supabase.com/dashboard/project/ggdnqnmdrszrbkiwbkik |
| GitHub | dlezcanob | github.com/dlezcanob/cv-portfolio |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/              → Panel de administración (requiere login)
│   │   ├── analytics/      → Dashboard de visitas (interno)
│   │   ├── certificaciones/
│   │   ├── educacion/
│   │   ├── experiencias/   → Formulario multi-cargo por institución
│   │   ├── generar-pdf/
│   │   ├── perfil/
│   │   └── referencias/
│   ├── api/
│   │   ├── cv/generate/    → Genera PDF del CV
│   │   └── visitas/        → POST para registrar visitas (analytics)
│   ├── login/
│   │   ├── forgot-password/ → Solicitar reset de contraseña
│   │   └── reset-password/  → Ingresar nueva contraseña
│   ├── icon.tsx            → Favicon dinámico (DLB en azul)
│   ├── opengraph-image.tsx → OG image para redes sociales
│   ├── layout.tsx          → Metadata, metadataBase
│   └── page.tsx            → Página pública del portfolio
├── components/
│   ├── admin/AdminNav.tsx  → Navegación del panel admin
│   ├── DownloadButton.tsx  → Botón descargar CV
│   └── TrackVisit.tsx      → Componente invisible que registra visitas
└── lib/
    ├── cv-template.ts      → Template del PDF
    ├── data.ts             → Queries a Supabase (getCvData, etc.)
    ├── supabase/
    │   ├── client.ts       → Cliente browser (Client Components)
    │   └── server.ts       → Cliente server (Server Components/API)
    └── types.ts            → Interfaces TypeScript
```

---

## Base de Datos (Supabase)

### Tablas:
- **perfil** — Singleton con datos personales
- **experiencias** — Múltiples registros por institución (agrupados por nombre)
- **educacion** — Grados y cursos (campo `tipo`)
- **certificaciones** — Con código y archivos adjuntos
- **habilidades** — Categorizadas
- **referencias** — Nombre, teléfono, cargo
- **visitas** — Analytics interno (pagina, referrer, ip_hash, user_agent, created_at)

### RLS:
- Lectura pública en todas las tablas (excepto visitas)
- Escritura solo autenticados
- Visitas: inserción pública, lectura solo autenticados

---

## Variables de Entorno (Vercel)

| Variable | Valor |
|----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://ggdnqnmdrszrbkiwbkik.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | (configurada en Vercel) |
| NEXT_PUBLIC_SITE_URL | https://davidlezcano.vercel.app |
| PDF_OWNER_PASSWORD | (configurada en Vercel) |

---

## Funcionalidades Implementadas

### Página Pública (/)
- Hero con foto, nombre, título, contacto, botón descargar CV
- Resumen profesional (full width)
- Certificaciones en grid
- **Trayectoria Profesional** — Timeline ejecutivo compacto (institución resumida + cargo resumido + periodo)
  - Nombres largos se cortan antes del " - "
  - Cargos se cortan antes del " - " o " ("
  - Posiciones actuales en verde
- **Experiencia Profesional** — Detalle agrupado por institución
  - Múltiples cargos bajo una misma institución con línea vertical
  - Duración (años/meses) al lado de cada fecha
  - Tiempo total laborado en el header de la sección
- Educación
- Tracking de visitas (TrackVisit component)
- OG image dinámico (DLB + info profesional en fondo azul)
- Favicon dinámico (DLB en cuadrado azul)

### Admin (/admin)
- **Experiencias** — Formulario multi-cargo por institución
  - Campo institución una sola vez
  - Botón "+ Agregar otro cargo en esta institución"
  - Cada cargo con fechas, funciones, logros, reconocimientos, proyectos
  - Lista agrupada por institución con acciones por cargo
- **Educación** — Grados y cursos con ordenamiento por fecha
- **Certificaciones** — Con archivo adjunto
- **Referencias** — CRUD simple
- **Perfil** — Datos personales
- **Generar PDF** — Genera CV en PDF con pdf-lib
- **Analytics** — Dashboard con:
  - Total visitas, visitantes únicos, promedio diario
  - Gráfica de barras por día (7/30/90 días)
  - Top fuentes de tráfico (referrers)

### Autenticación
- Login con email/password (Supabase Auth)
- Flujo "Olvidé mi contraseña":
  - /login/forgot-password → envía email
  - /login/reset-password → nueva contraseña
- Redirect URLs configuradas en Supabase para davidlezcano.vercel.app

---

## Consideraciones Técnicas

- **Git en esta máquina:** Instalado en `C:\Program Files\Git\cmd\git.exe`. La terminal de Kiro necesita `$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH` antes de usar git (o abrir nueva terminal).
- **OneDrive + Git:** Requiere `git config windows.appendAtomically false` para evitar errores de bloqueo de archivos.
- **ESLint estricto:** Vercel falla el build si hay variables no usadas. Siempre verificar antes de pushear.
- **Fechas en BD:** Formato `MM/YYYY` como texto. "Actualidad" para posiciones vigentes.
- **Agrupación de experiencias:** Se basa en coincidencia exacta del campo `institucion`. El nombre debe ser idéntico para que se agrupen.
- **Cálculo de duración:** Diferencia entre mes/año fin e inicio (sin +1). Mínimo 1 mes.

---

## Historial de Desarrollo (Agosto 2026)

1. Revisión inicial del proyecto
2. Fix: variable `cursos` duplicada en educacion/page.tsx
3. Feat: flujo de recuperación de contraseña (forgot + reset)
4. Feat: ordenar experiencias por fecha descendente
5. Feat: timeline de trayectoria profesional
6. Feat: agrupar experiencias por institución en página pública
7. Feat: formulario multi-cargo por institución en admin
8. Feat: analytics interno (tabla visitas + API + dashboard + TrackVisit)
9. Feat: OG image dinámico (DLB) + favicon personalizado
10. Feat: duración (años/meses) al lado de fechas + tiempo total
11. Fix: cálculo de duración (no sumar +1 mes)
12. Feat: timeline ejecutivo compacto (solo institución + cargo resumido)
13. Feat: resumen profesional full width
14. Chore: migración a dominio davidlezcano.vercel.app

---

## Pendientes Conocidos

- **Tabla visitas:** El usuario debe ejecutar el SQL en Supabase Dashboard (si no lo ha hecho, analytics no registra datos)
- **WhatsApp cache:** La preview puede tardar horas en actualizarse. Usar facebook.com/tools/debug/ para forzar refresh.
- **Schema SQL desactualizado:** Faltan columnas `archivo_url`, `archivo_tachado_url`, `cv_base_url` y tabla `referencias` en supabase-schema.sql
- **Archivos auxiliares en repo:** fix.py, fix_files.py, gen_sql.py, write_files.py podrían limpiarse
