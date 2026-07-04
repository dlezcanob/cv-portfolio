/**
 * Plantilla HTML/CSS que replica exactamente el diseño del CV actual.
 * Esta función genera el HTML completo que Puppeteer renderizará a PDF.
 */

import type { CvData } from './types'

/**
 * Genera el HTML completo del CV idéntico al diseño actual.
 * Layout: una columna, A4, Arial, iconos de contacto, foto, secciones con títulos azules.
 */
export function generateCvHtml(data: CvData): string {
  const { perfil, experiencias, certificaciones } = data

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    ${CV_STYLES}
  </style>
</head>
<body>
  <div class="cv-page">
    ${renderHeader(perfil)}
    ${renderResumen(perfil, certificaciones)}
    ${renderExperiencia(experiencias)}
  </div>
</body>
</html>`
}

// === ESTILOS CSS ===
const CV_STYLES = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

@page {
  size: A4;
  margin: 2.2cm 2.5cm 2cm 2.5cm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  line-height: 1.4;
  color: #000000;
}

.cv-page {
  width: 100%;
}

/* === HEADER === */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.header-left {
  flex: 1;
}

.header-right {
  width: 90px;
  margin-left: 15px;
}

.header-right img {
  width: 90px;
  height: auto;
  border: 1px solid #ccc;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
  font-size: 9pt;
}

.contact-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #0077B5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 8px;
  flex-shrink: 0;
}

.contact-link {
  color: #0066CC;
  text-decoration: underline;
  font-size: 9pt;
}

/* === NOMBRE === */
.nombre {
  font-size: 18pt;
  font-weight: bold;
  margin-top: 12px;
  margin-bottom: 4px;
  color: #000;
}

.blue-line {
  height: 2px;
  background-color: #4472C4;
  margin-bottom: 12px;
}

/* === RESUMEN === */
.resumen {
  text-align: justify;
  margin-bottom: 6px;
  font-size: 10pt;
  line-height: 1.5;
}

.cert-list {
  margin-top: 4px;
  margin-bottom: 16px;
  padding-left: 20px;
}

.cert-list li {
  margin-bottom: 2px;
  font-size: 10pt;
}

/* === SECCIÓN EXPERIENCIA === */
.section-title {
  text-align: center;
  color: #4472C4;
  font-size: 14pt;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 4px;
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* === ENTRADA DE EXPERIENCIA === */
.exp-entry {
  margin-bottom: 14px;
  page-break-inside: avoid;
}

.exp-fecha {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 1px;
}

.exp-institucion {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 1px;
}

.exp-cargo {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 4px;
}

.exp-label {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 2px;
}

.funciones-list {
  padding-left: 28px;
  margin-bottom: 6px;
}

.funciones-list li {
  margin-bottom: 3px;
  text-align: justify;
  font-size: 10pt;
  line-height: 1.4;
  list-style: none;
  position: relative;
  padding-left: 4px;
}

.funciones-list li::before {
  content: "\\2713";
  position: absolute;
  left: -18px;
  color: #333;
}

/* Logros */
.logros-section {
  margin-top: 6px;
  margin-left: 28px;
}

.logros-section .label {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 2px;
}

.logros-section .item {
  font-size: 10pt;
  margin-bottom: 1px;
}

/* Reconocimientos */
.reconocimientos-section {
  margin-top: 6px;
  margin-left: 28px;
}

.reconocimientos-section .label {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 2px;
}

.reconocimientos-section a {
  color: #0066CC;
  text-decoration: underline;
  font-size: 9pt;
  display: block;
  margin-bottom: 2px;
}

/* Proyectos numerados */
.proyectos-list {
  padding-left: 46px;
  margin-bottom: 6px;
}

.proyectos-list li {
  margin-bottom: 2px;
  font-size: 10pt;
  line-height: 1.4;
  text-align: justify;
}
`

// === FUNCIONES DE RENDERIZADO ===

function renderHeader(perfil: CvData['perfil']): string {
  const fotoHtml = perfil.foto_url
    ? `<div class="header-right"><img src="${perfil.foto_url}" alt="Foto profesional" /></div>`
    : ''

  return `
  <div class="header">
    <div class="header-left">
      <div class="contact-item">
        <span class="contact-icon">&#9742;</span>
        <span>${perfil.telefono}</span>
      </div>
      <div class="contact-item">
        <span class="contact-icon">&#9993;</span>
        <a href="mailto:${perfil.email}" class="contact-link">${perfil.email}</a>
      </div>
      <div class="contact-item">
        <span class="contact-icon">in</span>
        <a href="${perfil.linkedin_url}" class="contact-link">${perfil.linkedin_url}</a>
      </div>
    </div>
    ${fotoHtml}
  </div>
  <div class="nombre">${perfil.nombre_completo}</div>
  <div class="blue-line"></div>`
}

function renderResumen(perfil: CvData['perfil'], certificaciones: CvData['certificaciones']): string {
  const certItems = certificaciones
    .map((c) => `<li>${c.nombre}${c.codigo ? ` ${c.codigo}` : ''}</li>`)
    .join('\n')

  return `
  <p class="resumen">
    <strong>${perfil.titulo_profesional}</strong>. ${perfil.resumen}
  </p>
  <p class="resumen">Certificaciones principales en:</p>
  <ul class="cert-list">
    ${certItems}
  </ul>`
}

function renderExperiencia(experiencias: CvData['experiencias']): string {
  if (experiencias.length === 0) return ''

  const entries = experiencias.map((exp) => renderExpEntry(exp)).join('\n')

  return `
  <div class="section-title">Experiencia</div>
  ${entries}`
}

function renderExpEntry(exp: CvData['experiencias'][number]): string {
  // Funciones con checkmarks
  const funciones = Array.isArray(exp.funciones) ? exp.funciones : []
  const funcionesHtml = funciones.length > 0
    ? `<div class="exp-label">Funciones asignadas:</div>
       <ul class="funciones-list">
         ${funciones.map((f) => `<li>${f}</li>`).join('\n')}
       </ul>`
    : ''

  // Logros opcionales
  const logros = Array.isArray(exp.logros) && exp.logros.length > 0
    ? `<div class="logros-section">
        <div class="label">Logros</div>
        ${exp.logros.map((l) => `<div class="item">${l}</div>`).join('\n')}
       </div>`
    : ''

  // Reconocimientos opcionales
  const reconocimientos = Array.isArray(exp.reconocimientos) && exp.reconocimientos.length > 0
    ? `<div class="reconocimientos-section">
        <div class="label">Reconocimientos</div>
        ${exp.reconocimientos.map((r) => r.url ? `<a href="${r.url}">${r.titulo}</a>` : `<div>${r.titulo}</div>`).join('\n')}
       </div>`
    : ''

  // Proyectos numerados opcionales
  const proyectos = Array.isArray(exp.proyectos) && exp.proyectos.length > 0
    ? `<ol class="proyectos-list">
         ${exp.proyectos.map((p) => `<li>${p}</li>`).join('\n')}
       </ol>`
    : ''

  return `
  <div class="exp-entry">
    <div class="exp-fecha">${exp.fecha_inicio} – ${exp.fecha_fin}</div>
    <div class="exp-institucion">${exp.institucion}</div>
    <div class="exp-cargo">${exp.cargo}</div>
    ${funcionesHtml}
    ${logros}
    ${reconocimientos}
    ${proyectos}
  </div>`
}
