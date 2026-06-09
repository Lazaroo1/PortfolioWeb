import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, GraduationCap } from 'lucide-react'
import { OWNER, STATS } from '@/data/portfolio'

const BlackHoleScene = lazy(() => import('@/components/BlackHoleScene'))

function CounterStat({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={visible ? { opacity: 1, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200 }}
        className="font-display text-3xl sm:text-4xl font-bold text-white mb-1"
      >
        {value}
      </motion.div>
      <div className="font-body text-sm text-[#666]">{label}</div>
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
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 mb-16">
            {STATS.map((stat) => (
              <CounterStat key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>

          <div className="relative left-1/2 right-1/2 mb-0 ml-[-50vw] mr-[-50vw] w-screen px-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">
                universo personal
              </p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <div
              className="relative mx-auto w-full max-w-7xl rounded-2xl overflow-visible border border-white/[0.06]"
              style={{ background: 'radial-gradient(ellipse at center, #0a0805 0%, #050505 60%, #000000 100%)' }}
            >
              <Suspense
                fallback={
                  <div className="h-[640px] flex items-center justify-center">
                    <span className="font-mono text-xs text-white/20 animate-pulse">
                      initializing black hole…
                    </span>
                  </div>
                }
              >
                <BlackHoleScene />
              </Suspense>
            </div>

          </div>

        </motion.div>
      </div>
    </section>
  )
}
