import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Github, ChevronLeft, ChevronRight } from 'lucide-react'

export interface ProjectDetail {
  id: number
  title: string
  year: string
  description: string
  problem: string
  solution: string
  tags: string[]
  link: string | null
  hasVideo: boolean
  // Imágenes o clips .mp4 en loop (se ven como GIF); cada clip usa de portada el .jpg con el mismo nombre
  screenshots: string[]
  // Nombre de cada vista, en el mismo orden que screenshots
  captions?: string[]
  isMobile?: boolean
  metrics?: { label: string; value: string }[]
  // Lo que se lee en la barra de direcciones de la ventana (por defecto localhost)
  windowLabel?: string
}

function EmptyScreenshots() {
  return (
    <div className="flex h-48 w-full items-center justify-center rounded-xl border border-white/10 bg-[#111] font-mono text-xs text-white/25">
      Sin screenshots disponibles
    </div>
  )
}

function MobileCarousel({ screenshots }: { screenshots: string[] }) {
  const [current, setCurrent] = useState(0)
  const count = screenshots.length

  useEffect(() => {
    setCurrent(0)
  }, [screenshots])

  if (count === 0) return <EmptyScreenshots />

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Tipo Galaxy S24 Ultra: esquinas casi rectas, marco de titanio, bisel delgado y botones solo a la derecha.
          La pantalla (214×488) tiene la proporción de los screenshots (702×1600), así no se corta la barra de estado */}
      <div className="relative h-[502px] w-[228px] rounded-[15px] bg-gradient-to-b from-[#4b4b4d] via-[#2c2c2e] to-[#3d3d3f] p-[2px] shadow-2xl">
        <div className="absolute right-[-3px] top-[108px] h-[64px] w-[3px] rounded-r-sm bg-[#4b4b4d]" />
        <div className="absolute right-[-3px] top-[190px] h-[36px] w-[3px] rounded-r-sm bg-[#4b4b4d]" />
        {/* El borde negro es el bisel; la pantalla queda con esquinas de 8px (13 - 5) */}
        <div className="relative h-full w-full overflow-hidden rounded-[13px] border-[5px] border-black bg-black">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={screenshots[current]}
              alt=""
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
              loading={current === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute left-1/2 top-[7px] z-10 h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setCurrent((prev) => (prev - 1 + screenshots.length) % screenshots.length)
            }
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Screenshot anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex gap-1.5">
            {screenshots.map((screenshot, index) => (
              <button
                key={screenshot}
                type="button"
                onClick={() => setCurrent(index)}
                className={`rounded-full transition-all duration-200 ${
                  index === current
                    ? 'h-1.5 w-5 bg-white'
                    : 'h-1.5 w-1.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ver screenshot ${index + 1}`}
                aria-current={index === current}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev + 1) % screenshots.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Screenshot siguiente"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

const isClip = (src: string) => src.endsWith('.mp4')

// Ventana de Mac en modo oscuro. El modal es de un solo color, así que la barra va más clara,
// con borde y sombra, para que la ventana se distinga del fondo
function MacWindow({ label = 'localhost', children }: { label?: string; children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/[0.14] bg-[#111] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-1.5 border-b border-black/70 bg-[#262628] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#ff5f57]" />
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#febc2e]" />
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#28c840]" />
        <div className="mx-3 flex h-5 min-w-0 flex-1 items-center justify-center rounded-md bg-[#18181a] px-2">
          <span className="truncate font-mono text-[9px] text-white/40">{label}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function DesktopCarousel({
  screenshots,
  captions,
  windowLabel,
}: {
  screenshots: string[]
  captions?: string[]
  windowLabel?: string
}) {
  const [current, setCurrent] = useState(0)
  const count = screenshots.length
  const caption = captions?.[current]

  useEffect(() => {
    setCurrent(0)
  }, [screenshots])

  if (count === 0) return <EmptyScreenshots />

  const src = screenshots[current]
  const fade = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.22 },
  }

  return (
    <MacWindow label={windowLabel}>
      <div className="relative overflow-hidden bg-[#111]">
        <AnimatePresence mode="wait">
          {isClip(src) ? (
            <motion.video
              key={current}
              src={src}
              poster={src.replace(/\.mp4$/, '.jpg')}
              autoPlay
              muted
              loop
              playsInline
              aria-label={caption}
              {...fade}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <motion.img
              key={current}
              src={src}
              alt=""
              {...fade}
              loading={current === 0 ? 'eager' : 'lazy'}
              className="max-h-[380px] w-full object-cover"
            />
          )}
        </AnimatePresence>

        {caption && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] text-white/80 backdrop-blur-sm">
            {current + 1}/{count} · {caption}
          </span>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setCurrent((prev) => (prev - 1 + screenshots.length) % screenshots.length)
              }
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80"
              aria-label="Screenshot anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCurrent((prev) => (prev + 1) % screenshots.length)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80"
              aria-label="Screenshot siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {screenshots.map((screenshot, index) => (
                <button
                  key={screenshot}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`rounded-full transition-all duration-200 ${
                    index === current
                      ? 'h-1.5 w-5 bg-white'
                      : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Ver screenshot ${index + 1}`}
                  aria-current={index === current}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </MacWindow>
  )
}

function PagerButton({
  direction,
  project,
  onClick,
}: {
  direction: 'prev' | 'next'
  project: ProjectDetail | null
  onClick: () => void
}) {
  const isNext = direction === 'next'
  const Icon = isNext ? ChevronRight : ChevronLeft
  const label = isNext ? 'Siguiente' : 'Anterior'

  // El hover solo marca el círculo y el nombre, el botón mide lo que su contenido
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!project}
      aria-label={project ? `Proyecto ${label.toLowerCase()}: ${project.title}` : `Proyecto ${label.toLowerCase()}`}
      className={`group flex min-w-0 max-w-full items-center gap-3 outline-none disabled:invisible ${
        isNext ? 'flex-row-reverse justify-self-end text-right' : 'justify-self-start text-left'
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white group-focus-visible:ring-2 group-focus-visible:ring-white/50 group-active:scale-95 sm:h-10 sm:w-10">
        <Icon size={18} />
      </span>
      {/* En teléfono no caben nombres como "Bodega de Licores"; ahí quedan las flechas, el número y deslizar */}
      <span className="hidden min-w-0 sm:block">
        <span className="block font-mono text-[10px] uppercase tracking-widest text-white/25">
          {label}
        </span>
        <span className="block truncate font-display text-sm text-white/60 transition-colors group-hover:text-white">
          {project?.title}
        </span>
      </span>
    </button>
  )
}

const SCROLL_FADE_PX = 40

// En vez de una línea sobre el paginador, el contenido que sigue abajo se desvanece.
// El desvanecido se achica al llegar al final para que lo último se lea completo
function updateScrollFade(element: HTMLElement) {
  const remaining = element.scrollHeight - element.scrollTop - element.clientHeight
  const fade = Math.round(Math.min(SCROLL_FADE_PX, Math.max(0, remaining)))
  if (element.dataset.fade === String(fade)) return
  element.dataset.fade = String(fade)
  const mask = fade > 0 ? `linear-gradient(to bottom, #000 calc(100% - ${fade}px), transparent)` : ''
  element.style.setProperty('mask-image', mask)
  element.style.setProperty('-webkit-mask-image', mask)
}

export default function ProjectModal({
  project,
  onClose,
  projectList,
  currentIndex,
  onPrev,
  onNext,
}: {
  project: ProjectDetail | null
  onClose: () => void
  projectList: ProjectDetail[]
  currentIndex: number
  onPrev: () => void
  onNext: () => void
}) {
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < projectList.length - 1
  const prevProject = canGoPrev ? projectList[currentIndex - 1] : null
  const nextProject = canGoNext ? projectList[currentIndex + 1] : null
  // Deslizar a los lados cambia de proyecto solo en pantallas táctiles (con mouse estorbaría al seleccionar texto)
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const scrollRef = useRef<HTMLDivElement>(null)

  // También cuando cambia el tamaño: al girar el teléfono o cuando terminan de cargar las imágenes
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return undefined

    updateScrollFade(element)
    const observer = new ResizeObserver(() => updateScrollFade(element))
    observer.observe(element)
    for (const child of Array.from(element.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [project?.id])

  useEffect(() => {
    if (!project) return undefined

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && canGoPrev) onPrev()
      if (event.key === 'ArrowRight' && canGoNext) onNext()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    // El fondo animado y el blackhole quedan detrás del oscurecido: se pausan mientras haya un proyecto abierto
    document.documentElement.classList.add('project-modal-open')

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      document.documentElement.classList.remove('project-modal-open')
    }
  }, [project, onClose, canGoPrev, canGoNext, onPrev, onNext])

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
              aria-label="Cerrar modal"
            >
              <X size={15} />
            </button>

            {/* shrink-0: en columna (teléfono) los paneles no se encogen, el modal hace scroll.
                En pantallas táctiles se arrastra a los lados para pasar de proyecto */}
            <motion.div
              key={project.id}
              ref={scrollRef}
              onScroll={(event) => updateScrollFade(event.currentTarget)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              drag={isTouch ? 'x' : false}
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x + info.velocity.x * 0.2
                if (swipe < -80 && canGoNext) onNext()
                else if (swipe > 80 && canGoPrev) onPrev()
              }}
              className="flex min-h-0 flex-1 flex-col overflow-auto md:flex-row"
            >
              {/* Mismo fondo que el resto del modal: un bloque más oscuro detrás de cada imagen chocaba.
                  En columna (teléfono) el espacio de arriba deja la ventana debajo del botón de cerrar */}
              <div className="flex min-h-[260px] shrink-0 items-center justify-center px-5 pb-5 pt-14 md:w-[55%] md:p-5">
                {project.hasVideo ? (
                  // Misma proporción que la grabación (1280×602) para que no se recorten los lados
                  <MacWindow label={project.windowLabel}>
                    <video
                      src="/PortfolioWeb/bodega-demo.mp4"
                      poster="/PortfolioWeb/bodega-demo.jpg"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="block aspect-[1280/602] w-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    />
                  </MacWindow>
                ) : project.isMobile ? (
                  <MobileCarousel screenshots={project.screenshots} />
                ) : (
                  <DesktopCarousel
                    screenshots={project.screenshots}
                    captions={project.captions}
                    windowLabel={project.windowLabel}
                  />
                )}
              </div>

              <div className="shrink-0 p-6 md:w-[45%]">
                <p className="mb-1 font-mono text-xs text-white/25">{project.year}</p>
                <h2 id="project-modal-title" className="mb-2 font-display text-2xl font-bold text-white">
                  {project.title}
                </h2>
                <p className="mb-4 font-body text-sm leading-relaxed text-white/55">
                  {project.description}
                </p>

                {project.metrics && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {project.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border border-white/5 bg-white/5 p-3 text-center"
                      >
                        <p className="font-display text-lg font-bold text-white">{metric.value}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-white/25">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-4 space-y-3">
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/25">
                      Problema
                    </p>
                    <p className="font-body text-sm leading-relaxed text-white/50">
                      {project.problem}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/25">
                      Solución
                    </p>
                    <p className="font-body text-sm leading-relaxed text-white/50">
                      {project.solution}
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/25">
                    Tech Stack
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs text-white/45"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-white/90"
                    >
                      <Github size={14} />
                      Ver código
                    </a>
                  ) : (
                    <span className="font-mono text-xs italic text-white/20">
                      Repositorio privado
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Siempre visible, sin barra ni línea: flechas en las orillas y el número al centro */}
            <nav
              aria-label="Otros proyectos"
              className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 pb-3 pt-1 sm:px-5 sm:pb-4 sm:pt-2"
            >
              <PagerButton direction="prev" project={prevProject} onClick={onPrev} />
              <span className="font-mono text-[11px] tabular-nums text-white/30">
                <span className="text-white/70">{currentIndex + 1}</span>
                <span className="mx-1.5 text-white/15">/</span>
                {projectList.length}
              </span>
              <PagerButton direction="next" project={nextProject} onClick={onNext} />
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
