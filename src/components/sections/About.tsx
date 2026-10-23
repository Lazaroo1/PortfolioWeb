import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, GraduationCap } from 'lucide-react'
import { OWNER } from '@/data/portfolio'

const BlackHoleScene = lazy(() => import('@/components/BlackHoleScene'))

function BlackHolePlaceholder() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/[0.06]"
      style={{ background: 'radial-gradient(ellipse at center, #0a0805 0%, #050505 60%, #000000 100%)' }}
    >
      <span className="font-mono text-xs text-white/20 animate-pulse">
        initializing black hole…
      </span>
    </div>
  )
}

function BlackHoleWindow() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [shouldMount, setShouldMount] = useState(false)

  // El blackhole se monta (y compila sus shaders) cuando la sección está a una pantalla de distancia
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldMount(true)
        observer.disconnect()
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="relative aspect-[4/5] max-h-[80svh] w-full sm:aspect-video">
      {shouldMount ? (
        <Suspense fallback={<BlackHolePlaceholder />}>
          <BlackHoleScene />
        </Suspense>
      ) : (
        <BlackHolePlaceholder />
      )}
    </div>
  )
}

export default function About() {
  return (
    <section
      id="about"
      className="px-6 pb-12 pt-24 sm:pb-16 sm:pt-32"
      style={{ position: 'relative', zIndex: 'auto' }}
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          {/* Label */}
          <p className="font-mono text-xs text-white tracking-widest uppercase mb-4">
            Sobre mí
          </p>

          {/* Heading + Text */}
          <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#e8e8e8] mb-6 leading-tight">
                Construyo cosas
                <span className="text-white"> reales.</span>
              </h2>
              <p className="font-body text-[#999] text-base leading-relaxed mb-4">
                {OWNER.description}
              </p>
              <p className="font-body text-[#999] text-base leading-relaxed">
                Me interesa el frontend engineering, la experiencia de usuario y 
                la arquitectura que escala. Busco oportunidades donde pueda aportar 
                desde el día uno.
              </p>
            </div>

            <div className="space-y-4">
              {/* Location */}
              <div className="flex items-center gap-3 text-[#666]">
                <MapPin size={16} className="text-white shrink-0" />
                <span className="font-body text-sm">{OWNER.location}</span>
              </div>
              {/* University */}
              <div className="flex items-center gap-3 text-[#666]">
                <GraduationCap size={16} className="text-white shrink-0" />
                <span className="font-body text-sm">{OWNER.university}</span>
              </div>

              {/* Divider */}
              <div className="pt-6 mt-6">
                <p className="font-mono text-xs text-[#444] mb-3 uppercase tracking-wider">Stack principal</p>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'].map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-xs text-white border border-white/20 bg-white/5 px-3 py-1 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Black Hole Interactive Section ── */}
          {/* Sale de la columna de texto: ventana de hasta ~1150px, 16:9 en desktop y 4:5 en teléfono */}
          <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">
                  universo personal
                </p>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <BlackHoleWindow />
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
