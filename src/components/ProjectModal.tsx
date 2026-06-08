import { useEffect, useState } from 'react'
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
  screenshots: string[]
  isMobile?: boolean
  metrics?: { label: string; value: string }[]
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
      <div className="relative h-[480px] w-[235px] rounded-[28px] border border-[#333] bg-[#1a1a1a] p-[7px] shadow-2xl">
        <div className="absolute right-[-5px] top-[150px] h-[60px] w-1 rounded-full bg-[#444]" />
        <div className="absolute left-[-5px] top-[120px] h-[45px] w-1 rounded-full bg-[#444]" />
        <div className="absolute left-[-5px] top-[173px] h-[45px] w-1 rounded-full bg-[#444]" />
        <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-black">
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
          <div className="absolute left-1/2 top-[14px] z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
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

function DesktopCarousel({ screenshots }: { screenshots: string[] }) {
  const [current, setCurrent] = useState(0)
  const count = screenshots.length

  useEffect(() => {
    setCurrent(0)
  }, [screenshots])

  if (count === 0) return <EmptyScreenshots />

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 rounded-t-xl border-b border-white/5 bg-[#1a1a1a] px-4 py-2.5">
        <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="mx-3 flex h-5 flex-1 items-center justify-center rounded bg-[#111]">
          <span className="font-mono text-[9px] text-white/15">localhost</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-b-xl border border-t-0 border-white/10 bg-[#111]">
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
            className="max-h-[380px] w-full object-cover"
          />
        </AnimatePresence>

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
    </div>
  )
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

  useEffect(() => {
    if (!project) return undefined

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && canGoPrev) onPrev()
      if (event.key === 'ArrowRight' && canGoNext) onNext()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [project, onClose, canGoPrev, canGoNext, onPrev, onNext])

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
            className="relative z-10 w-full max-w-7xl overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canGoPrev}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white/50"
                aria-label="Proyecto anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white/50"
                aria-label="Proyecto siguiente"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Cerrar modal"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col overflow-auto md:flex-row" style={{ maxHeight: '90vh' }}>
              <div className="flex min-h-[260px] items-center justify-center bg-[#080808] p-5 md:w-[55%]">
                {project.hasVideo ? (
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <video
                      src="/PortfolioWeb/bodega-demo.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                ) : project.isMobile ? (
                  <MobileCarousel screenshots={project.screenshots} />
                ) : (
                  <DesktopCarousel screenshots={project.screenshots} />
                )}
              </div>

              <div className="p-6 md:w-[45%]">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
