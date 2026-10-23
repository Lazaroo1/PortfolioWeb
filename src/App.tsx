import { useState, useEffect, lazy, Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { NavBar } from './components/ui/tubelight-navbar'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Projects from './components/sections/Projects'
import Skills from './components/sections/Skills'
import Contact from './components/sections/Contact'
import GeminiChat from './components/GeminiChat'

// Panel de diagnóstico para probar en el teléfono: solo en desarrollo y con ?debug en la URL
const DevPerfOverlay =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug')
    ? lazy(() => import('./components/DevPerfOverlay'))
    : null

export default function App() {
  const [activeSection, setActiveSection] = useState('hero')

  // IntersectionObserver para detectar sección activa
  useEffect(() => {
    const sections = ['hero', 'about', 'projects', 'skills', 'contact']
    const observers: IntersectionObserver[] = []

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.2, rootMargin: '-80px 0px -10% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
      {/* Navbar */}
      <NavBar activeSection={activeSection} />

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1, isolation: 'isolate' }}>
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <GeminiChat />
      {DevPerfOverlay && (
        <Suspense fallback={null}>
          <DevPerfOverlay />
        </Suspense>
      )}
    </ThemeProvider>
  )
}
