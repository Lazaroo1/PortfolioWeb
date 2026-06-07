import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Github, Play } from 'lucide-react'
import ProjectModal, { ProjectDetail } from '@/components/ProjectModal'

const BASE = '/PortfolioWeb/screenshots/'

const PROJECTS_DATA: ProjectDetail[] = [
  {
    id: 1,
    title: 'Bodega de Licores',
    year: '2026',
    description:
      'Sistema empresarial completo para gestión de inventario, ventas y operaciones de una bodega de licores.',
    problem:
      'La bodega operaba con procesos manuales sin visibilidad en tiempo real de inventario, ventas ni movimientos de caja.',
    solution:
      'Plataforma full stack con arquitectura por capas, RBAC con Clerk, CI/CD con GitHub Actions y 316 tests Jest ejecutados sin base de datos real.',
    tags: [
      'Node.js',
      'TypeScript',
      'Vue 3',
      'Pinia',
      'PostgreSQL',
      'Prisma',
      'Docker',
      'GitHub Actions',
      'Clerk',
      'Cloudflare R2',
    ],
    link: null,
    hasVideo: true,
    videoId: 'ZesBuWq-PbQ',
    screenshots: [],
    isMobile: false,
    metrics: [
      { label: 'Tests Jest', value: '316' },
      { label: 'Cobertura', value: 'Full' },
      { label: 'CI/CD', value: 'Auto' },
    ],
  },
  {
    id: 2,
    title: 'OmniMarket',
    year: '2026',
    description:
      'Tienda retail full stack con SQL avanzado visible en la UI, transacciones ACID y control de acceso por roles.',
    problem:
      'Necesidad de una plataforma de retail que expusiera la complejidad técnica del SQL directamente en la interfaz.',
    solution:
      'Dashboard interactivo con CTEs, stored procedures visibles, control de acceso por roles y generación dinámica de reportes PDF.',
    tags: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Docker'],
    link: 'https://github.com/Lazaroo1/proyecto2-db1',
    hasVideo: false,
    screenshots: [
      `${BASE}omnimarket-1.png`,
      `${BASE}omnimarket-2.png`,
      `${BASE}omnimarket-3.png`,
      `${BASE}omnimarket-4.png`,
    ],
    isMobile: false,
    metrics: [
      { label: 'Roles', value: 'RBAC' },
      { label: 'Transacc.', value: 'ACID' },
      { label: 'Export', value: 'PDF' },
    ],
  },
  {
    id: 3,
    title: 'MoodNutri',
    year: '2025',
    description:
      'App Android que recomienda recetas personalizadas según el estado de ánimo usando Gemini API y OpenAI.',
    problem:
      'Los usuarios no tenían forma rápida y personalizada de obtener recetas basadas en cómo se sienten y qué ingredientes tienen.',
    solution:
      'App con arquitectura MVI, reconocimiento de ingredientes por imagen con Gemini API y generación de recetas en 3 idiomas con OpenAI API.',
    tags: [
      'Kotlin',
      'Jetpack Compose',
      'Firebase',
      'Room',
      'DataStore',
      'Gemini API',
      'OpenAI API',
      'Retrofit',
    ],
    link: 'https://github.com/Programacion-de-Plataformas-Mobiles/MoodNutri',
    hasVideo: false,
    screenshots: [
      `${BASE}moodnutri-1.png`,
      `${BASE}moodnutri-2.png`,
      `${BASE}moodnutri-3.png`,
      `${BASE}moodnutri-4.png`,
    ],
    isMobile: true,
    metrics: [
      { label: 'Idiomas', value: '3' },
      { label: 'APIs IA', value: 'x2' },
      { label: 'Arch', value: 'MVI' },
    ],
  },
  {
    id: 4,
    title: 'Series Tracker',
    year: '2026',
    description:
      'API REST en Go con Swagger/OpenAPI embebido, búsqueda, paginación, ratings y frontend lightweight.',
    problem:
      'Necesitaba demostrar manejo de APIs REST idiomáticas en Go sin frameworks externos, con documentación automática.',
    solution:
      'API con net/http estándar, SQLite, Swagger/OpenAPI embebido, deploy dockerizado en Railway y frontend vanilla JS con exportación CSV.',
    tags: ['Go', 'SQLite', 'OpenAPI', 'Swagger', 'Docker', 'Railway'],
    link: 'https://github.com/Lazaroo1/proyecto1-STW-frontend',
    hasVideo: false,
    screenshots: [`${BASE}series-tracker-1.png`, `${BASE}series-tracker-2.png`],
    isMobile: false,
    metrics: [
      { label: 'Lenguaje', value: 'Go' },
      { label: 'Deploy', value: 'Railway' },
      { label: 'Docs', value: 'OAS3' },
    ],
  },
]

export default function Projects() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const selectedProject = PROJECTS_DATA.find((project) => project.id === selectedId) ?? null

  return (
    <section id="projects" className="relative z-10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/40">
            02 / Proyectos
          </p>
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Lo que he construido.
          </h2>
        </motion.div>

        <div className="space-y-0">
          {PROJECTS_DATA.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(project.id)}
              onBlur={() => setHoveredId(null)}
              onClick={() => setSelectedId(project.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedId(project.id)
                }
              }}
              role="button"
              tabIndex={0}
              className="group relative cursor-pointer border-t border-white/[0.08] py-6 outline-none"
            >
              <div
                className={`absolute inset-0 -mx-6 rounded-xl bg-white/[0.03] transition-opacity duration-200 ${
                  hoveredId === project.id ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div className="relative flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3
                      className={`font-display text-xl font-bold transition-colors duration-200 ${
                        hoveredId === project.id ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      {project.title}
                    </h3>
                    {project.hasVideo && (
                      <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/40">
                        <Play size={9} fill="currentColor" />
                        demo
                      </span>
                    )}
                    <ArrowUpRight
                      size={16}
                      className={`text-white/40 transition-all duration-200 ${
                        hoveredId === project.id
                          ? 'translate-x-0 translate-y-0 opacity-100'
                          : '-translate-x-1 translate-y-1 opacity-0'
                      }`}
                    />
                  </div>

                  <p className="mb-3 max-w-2xl font-body text-sm leading-relaxed text-white/40">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-white/30"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 5 && (
                      <span className="self-center font-mono text-[10px] text-white/20">
                        +{project.tags.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                  <span className="font-mono text-xs text-white/20">{project.year}</span>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="flex items-center gap-1 font-mono text-[10px] text-white/30 transition-colors hover:text-white/60"
                    >
                      <Github size={11} />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-white/[0.08]" />
        </div>
      </div>

      <ProjectModal project={selectedProject} onClose={() => setSelectedId(null)} />
    </section>
  )
}
