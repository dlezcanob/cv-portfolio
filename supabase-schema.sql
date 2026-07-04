-- =============================================================
-- Schema SQL para CV Portfolio Platform
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================

-- Tabla: perfil (singleton - solo un registro)
CREATE TABLE perfil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  titulo_profesional TEXT NOT NULL,
  resumen TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: experiencias
CREATE TABLE experiencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_inicio TEXT NOT NULL, -- MM/YYYY
  fecha_fin TEXT NOT NULL, -- MM/YYYY o "Actualidad"
  institucion TEXT NOT NULL,
  cargo TEXT NOT NULL,
  funciones JSONB NOT NULL DEFAULT '[]', -- Array de strings
  logros JSONB, -- Array de strings
  reconocimientos JSONB, -- Array de {titulo, url?}
  proyectos JSONB, -- Array de strings
  orden INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: educacion
CREATE TABLE educacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion TEXT NOT NULL,
  titulo TEXT NOT NULL,
  fecha_inicio TEXT NOT NULL,
  fecha_fin TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: certificaciones
CREATE TABLE certificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  institucion_emisora TEXT NOT NULL,
  codigo TEXT, -- Ej: "(PMP)® (2020921)"
  fecha_obtencion TEXT,
  archivo_url TEXT, -- URL en Supabase Storage
  orden INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: habilidades
CREATE TABLE habilidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true
);

-- =============================================================
-- Row Level Security (RLS) - Solo lectura pública, escritura autenticada
-- =============================================================

ALTER TABLE perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE educacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE habilidades ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (para el portfolio y PDF)
CREATE POLICY "Lectura pública perfil" ON perfil FOR SELECT USING (true);
CREATE POLICY "Lectura pública experiencias" ON experiencias FOR SELECT USING (true);
CREATE POLICY "Lectura pública educacion" ON educacion FOR SELECT USING (true);
CREATE POLICY "Lectura pública certificaciones" ON certificaciones FOR SELECT USING (true);
CREATE POLICY "Lectura pública habilidades" ON habilidades FOR SELECT USING (true);

-- Políticas de escritura solo para usuarios autenticados
CREATE POLICY "Escritura autenticada perfil" ON perfil FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura autenticada experiencias" ON experiencias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura autenticada educacion" ON educacion FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura autenticada certificaciones" ON certificaciones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura autenticada habilidades" ON habilidades FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================
-- Storage bucket para archivos (foto y certificados)
-- =============================================================
-- Ejecutar por separado en Supabase Dashboard → Storage → Create bucket:
-- Nombre: "archivos"
-- Public: true (para que la foto se muestre sin auth)

-- =============================================================
-- Datos iniciales del perfil
-- =============================================================
INSERT INTO perfil (nombre_completo, titulo_profesional, resumen, email, telefono, linkedin_url)
VALUES (
  'David Lezcano Balarezo',
  'Ingeniero Empresarial y de Sistema con Maestría en Ciencias Empresariales y actualmente cursando Maestría en Administración con mención en Gestión Pública',
  'Profesional con más de 20 años de experiencia liderando proyectos de transformación digital, gobierno corporativo y gestión de TI. Experto en dirección estratégica, implementación de soluciones tecnológicas, gestión documental, seguridad informática y proyectos en infraestructura Cloud. Alineado a buenas prácticas ITIL y PMBOK, con enfoque en liderazgo, innovación y cumplimiento de objetivos institucionales.',
  'david.lezcano@usil.pe',
  '982011333',
  'https://www.linkedin.com/in/david-lezcano-balarezo-pmp%C2%AE-itil%C2%AE-smc%C2%AE-9966981b/'
);

-- Certificaciones principales (se muestran en header del CV)
INSERT INTO certificaciones (nombre, institucion_emisora, codigo, orden) VALUES
('Project Management Professional (PMP)®', 'PMI', '(2020921)', 1),
('ITIL ® Foundation', 'EXIN', 'EXIN247807', 2),
('Scrum Master Certified', 'CertiProf', '(655994)', 3);
