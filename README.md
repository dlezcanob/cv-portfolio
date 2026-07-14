# CV Portfolio Platform — David Lezcano Balarezo

## Descripcion

Plataforma web para administrar y generar CV profesional en PDF. Permite agregar experiencias, educacion, certificaciones y referencias de forma incremental. Genera PDFs automaticamente con el formato profesional, watermark y proteccion de documentos.

**URL en produccion:** https://cv-portfolio-beryl-nine.vercel.app
**Repositorio:** https://github.com/dlezcanob/cv-portfolio

---

## Stack Tecnologico

| Componente | Tecnologia | Uso |
|-----------|-----------|-----|
| Frontend | Next.js 14 (App Router) | SSR + API Routes |
| Lenguaje | TypeScript | Tipado estricto |
| Estilos | Tailwind CSS | Utility-first CSS |
| Base de datos | Supabase (PostgreSQL) | Datos del CV |
| Autenticacion | Supabase Auth | Login del admin |
| Storage | Supabase Storage (bucket: archivos) | PDFs y fotos |
| PDF Generation | pdf-lib | Genera CV sin Chrome |
| Iconos | Lucide React | Iconografia |
| Hosting | Vercel (free tier) | Deploy automatico |

---

## Estructura del Proyecto

