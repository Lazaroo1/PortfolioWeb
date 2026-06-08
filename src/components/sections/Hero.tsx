import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Download } from 'lucide-react'
import VaporizeTextCycle, { Tag } from '@/components/ui/vaporize-text'
import { OWNER, HERO_TEXTS } from '@/data/portfolio'

const ShaderAnimation = lazy(() => import('@/components/ui/shader-animation'))

export default function Hero() {
  const nameParts = OWNER.name.split(' ')
  const nameFirstLine = nameParts.slice(0, -1).join(' ')
  const nameLastLine = nameParts.slice(-1).join('')

  const handleScroll = () => {
    const el = document.getElementById('about')
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
  }

  return (
    <>
      <Suspense fallback={null}>
        <ShaderAnimation />
      </Suspense>

      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
      {/* Content */}
      <div className="relative z-10 w-full text-center px-6 max-w-[22rem] sm:max-w-4xl mx-auto">
        {/* Chip de disponibilidad */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 text-xs font-mono text-white border border-white/30 bg-white/5 rounded-full px-4 py-1.5 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Disponible para oportunidades
        </motion.div>

        {/* Nombre */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-[#e8e8e8] tracking-tight mb-4 leading-tight"
        >
          <span className="block sm:inline">{nameFirstLine}</span>
          <span className="hidden sm:inline"> </span>
          <span className="block sm:inline">{nameLastLine}</span>
        </motion.h1>

        {/* Vaporize text — titles cycling */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="h-14 sm:h-16 flex items-center justify-center mb-6"
        >
          <div className="w-full max-w-lg h-full">
            <VaporizeTextCycle
              texts={HERO_TEXTS}
              font={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
              }}
              color="rgb(255, 255, 255)"
              spread={4}
              density={7}
              animation={{
                vaporizeDuration: 1.8,
                fadeInDuration: 0.8,
                waitDuration: 1.5,
              }}
              direction="left-to-right"
              alignment="center"
              tag={Tag.H2}
            />
          </div>
        </motion.div>

        {/* Descripción */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="font-body text-[#999] text-base sm:text-lg max-w-[21rem] sm:max-w-xl mx-auto mb-10 leading-relaxed"
        >
          {OWNER.description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="relative z-20 flex flex-col sm:flex-row gap-4 justify-center items-center"
          style={{ position: 'relative' }}
        >
          <button
            onClick={() => {
              const el = document.getElementById('projects')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{ position: 'relative', zIndex: 30 }}
            className="inline-flex items-center gap-2 bg-white text-[#0a0a0a] font-display font-bold text-sm px-8 py-3 rounded-full hover:bg-white/90 transition-colors cursor-pointer"
          >
            Ver proyectos
          </button>
          <a
            href="/PortfolioWeb/lazaro-cv.pdf"
            download="Lazaro-Diaz-CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'relative', zIndex: 30 }}
            className="inline-flex items-center gap-2 border border-white/20 text-white font-display text-sm px-8 py-3 rounded-full hover:border-white/50 hover:text-white transition-colors"
          >
            <Download size={15} />
            Descargar CV
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        onClick={handleScroll}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#444] hover:text-white transition-colors"
        aria-label="Scroll down"
      >
        <ArrowDown size={20} className="animate-bounce" />
      </motion.button>
      </section>
    </>
  )
}
