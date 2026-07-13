/**
 * Página pública del portafolio.
 * Muestra la información profesional y un botón para descargar el CV en PDF.
 */

import { getCvData } from '@/lib/data'
import { Phone, Mail, Briefcase, GraduationCap, Award, CheckCircle } from 'lucide-react'
import { DownloadButton } from '@/components/DownloadButton'

export default async function HomePage() {
  const cvData = await getCvData()

  // Si no hay datos (Supabase no configurado), mostrar placeholder
  if (!cvData.perfil) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">CV Portfolio</h1>
          <p className="text-gray-600 mb-4">
            Configura Supabase para ver el portafolio. Ejecuta el schema SQL y agrega
            las variables de entorno en .env.local
          </p>
          <code className="text-sm bg-gray-100 p-2 rounded block">
            supabase-schema.sql
          </code>
        </div>
      </main>
    )
  }

  const { perfil, experiencias, certificaciones, educacion } = cvData

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero / Header */}
      <header className="bg-[#1B4F72] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {perfil.foto_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={perfil.foto_url}
              alt={perfil.nombre_completo}
			  className="w-44 h-44 rounded-full border-4 border-white/20 object-cover p-1 bg-white/10"

            />
          )}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold mb-2">{perfil.nombre_completo}</h1>
            <p className="text-blue-200 text-lg mb-4">{perfil.titulo_profesional}</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-blue-100">
              <a href={`tel:${perfil.telefono}`} className="flex items-center gap-1 hover:text-white transition-colors">
                <Phone size={14} /> {perfil.telefono}
              </a>
              <a href={`mailto:${perfil.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                <Mail size={14} /> {perfil.email}
              </a>
              <a href={perfil.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            </div>
          </div>
          <DownloadButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Resumen */}
        <section>
          <p className="text-gray-700 leading-relaxed text-justify max-w-prose">
            {perfil.resumen}
          </p>
        </section>

        {/* Certificaciones */}
        {certificaciones.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1B4F72] mb-4 flex items-center gap-2">
              <Award size={22} /> Certificaciones
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {certificaciones.map((cert) => (
                <div key={cert.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <p className="font-medium text-gray-800">{cert.nombre}</p>
                  <p className="text-sm text-gray-500">{cert.institucion_emisora}</p>
                  {cert.codigo && <p className="text-xs text-gray-400 mt-1">{cert.codigo}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experiencia */}
        {experiencias.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1B4F72] mb-6 flex items-center gap-2">
              <Briefcase size={22} /> Experiencia Profesional
            </h2>
            <div className="space-y-6">
              {experiencias.map((exp) => (
                <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{exp.cargo}</h3>
                    <span className="text-sm text-gray-500">{exp.fecha_inicio} – {exp.fecha_fin}</span>
                  </div>
                  <p className="text-[#2E86C1] font-medium mb-3">{exp.institucion}</p>
                  {Array.isArray(exp.funciones) && exp.funciones.length > 0 && (
                    <ul className="space-y-1">
                      {exp.funciones.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Educación */}
        {educacion.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1B4F72] mb-4 flex items-center gap-2">
              <GraduationCap size={22} /> Educación
            </h2>
            <div className="space-y-3">
              {educacion.map((edu) => (
                <div key={edu.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <p className="font-medium text-gray-800">{edu.titulo}</p>
                  <p className="text-sm text-gray-500">{edu.institucion} | {edu.fecha_fin}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        <p>&copy; {new Date().getFullYear()} {perfil.nombre_completo}. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
