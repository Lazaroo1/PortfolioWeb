import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatProxyResponse {
  reply?: string
  error?: string
  details?: string
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word))
}

// El chat muestra texto plano: si el modelo igual manda Markdown, se quitan las marcas
function toPlainText(reply: string) {
  return reply
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*•]\s+/gm, '- ')
}

function getLocalPortfolioAnswer(question: string) {
  const q = normalizeText(question)

  // Va primero: "¿qué nivel de inglés tiene Lázaro?" también contiene "lazaro"
  if (hasAny(q, ['ingles', 'english', 'idioma'])) {
    return 'Lázaro habla español (nativo) e inglés a nivel C1, así que puede trabajar en equipos y con documentación en inglés.'
  }

  // También antes del contacto: "¿por qué se mueven las ondas en el teléfono?" contiene "telefono"
  if (hasAny(q, ['giroscop', 'gyro', 'inclin', 'ondas', 'sensor']) || (q.includes('fondo') && hasAny(q, ['muev', 'mover']))) {
    return 'Las ondas del fondo reaccionan a ti: en la compu se doblan hacia el cursor del mouse y en el teléfono se mueven al inclinarlo, con el giroscopio. Funciona en la página publicada (HTTPS); en iPhone primero hay que tocar el botón "Mover el fondo con el teléfono" para dar permiso. Todo se calcula en tiempo real con un shader de WebGL.'
  }

  if (hasAny(q, ['hola', 'buenas', 'hey', 'que onda', 'saludos'])) {
    return '¡Qué onda! Soy el asistente del portafolio de Lázaro. Pregúntame por sus proyectos, stack, experiencia, contacto o cómo está hecho este sitio.'
  }

  if (hasAny(q, ['contacto', 'correo', 'email', 'telefono', 'linkedin', 'github'])) {
    return [
      'Contacto directo de Lázaro:',
      '- Email: ldbojorquez@gmail.com',
      '- Teléfono: 53862772',
      '- GitHub: https://github.com/Lazaroo1',
      '- LinkedIn: https://www.linkedin.com/in/lazaro-diaz-146b5b39a',
    ].join('\n')
  }

  if (hasAny(q, ['quien', 'perfil', 'lazaro', 'zaro', 'sobre el', 'sobre mi'])) {
    return [
      'Lázaro Daniel Díaz Bojórquez, alias zaro, es Full Stack Engineer / Frontend Specialist.',
      '',
      'Qué hace:',
      '- Construye apps full stack con React, Vue, Node.js y PostgreSQL.',
      '- Le interesa el frontend engineering, UI/UX premium y arquitectura escalable.',
      '- También trabaja con Kotlin, Go, Docker, CI/CD, APIs de IA y WebGL.',
      '- Estudia 6° semestre de Ingeniería en Ciencias de la Computación en UVG.',
    ].join('\n')
  }

  if (hasAny(q, ['stack', 'tecnologias', 'habilidades', 'skills'])) {
    return [
      'Stack principal de Lázaro:',
      '- Frontend: React, Vue 3, Vite, TypeScript, Tailwind CSS, Pinia, Framer Motion.',
      '- Backend: Node.js, Express, Go, Laravel 11, FastAPI, Elysia.',
      '- Bases de datos: PostgreSQL, MySQL, SQLite, Redis, Neo4j, Room.',
      '- DevOps: Docker, Docker Compose, GitHub Actions, Nginx, Cloudflare, Railway.',
      '- IA/APIs: Gemini API, OpenAI API, Swagger/OpenAPI, Retrofit.',
    ].join('\n')
  }

  if (hasAny(q, ['frontend', 'ui', 'ux', 'interfaz', 'react', 'vue', 'tailwind'])) {
    return 'En frontend, Lázaro trabaja principalmente con React, Vue 3, TypeScript, Vite, Tailwind CSS, Pinia y Framer Motion. Su enfoque visual es minimalista, oscuro, mate y de alta fidelidad, con atención fuerte a responsive, legibilidad y experiencia de usuario.'
  }

  if (hasAny(q, ['backend', 'api', 'node', 'express', 'go', 'laravel', 'fastapi'])) {
    return 'En backend, Lázaro ha trabajado con Node.js, Express, Go, Laravel 11, FastAPI, Prisma ORM y Eloquent ORM. Sus proyectos muestran APIs REST, arquitectura por capas, RBAC, cookies HttpOnly, documentación OpenAPI y despliegues con Docker/Railway.'
  }

  if (hasAny(q, ['base de datos', 'database', 'sql', 'postgres', 'mysql', 'sqlite', 'metabase'])) {
    return 'En datos, Lázaro maneja PostgreSQL, MySQL, SQLite, Redis, Neo4j y Room. Sus proyectos incluyen SQL avanzado, CTEs, transacciones ACID, stored procedures, dashboards BI con Metabase y modelos relacionales complejos.'
  }

  if (hasAny(q, ['proyecto', 'proyectos', 'portfolio', 'portafolio'])) {
    return [
      'Proyectos principales:',
      '- Bodega de Licores: sistema en producción hecho en equipo con Vue 3, Node.js, PostgreSQL, Clerk, Cloudflare R2 y CI/CD.',
      '- OmniMarket: retail dashboard con React, PostgreSQL, SQL avanzado, transacciones ACID y reportes PDF.',
      '- MoodNutri: app Android con Kotlin, Jetpack Compose, Gemini API y OpenAI API.',
      '- Series Tracker: API REST en Go, SQLite, Swagger/OpenAPI y Docker/Railway.',
      '- RetailMax: dashboard analítico con PostgreSQL, Metabase, Docker y KPIs de negocio.',
      '- Gargantua: agujero negro renderizado 100 % en CPU con Rust, geodésicas de Schwarzschild (RK4) y gas volumétrico.',
      '',
      'El más fuerte para mostrar ingeniería completa es Bodega de Licores; el más fuerte para datos es OmniMarket/RetailMax.',
    ].join('\n')
  }

  if (hasAny(q, ['bodega', 'licores'])) {
    return 'Bodega de Licores es un sistema en producción desarrollado en equipo: backend por capas con Node.js, Express, Prisma y PostgreSQL; frontend en Vue 3 + Pinia; RBAC con Clerk; Cloudflare R2 y CI/CD con GitHub Actions. Lázaro tiene más de 330 commits: rediseño para teléfono y accesibilidad, el editor del carrusel y de ofertas, filtros del panel y la refactorización por capas del módulo /me.'
  }

  if (hasAny(q, ['omnimarket', 'retail'])) {
    return 'OmniMarket es una app web de retail enfocada en datos: React + Vite en frontend, Node/Express en backend y PostgreSQL. Destaca por SQL avanzado visible en UI, CTEs, transacciones ACID, stored procedures, roles, cookies HttpOnly y reportes PDF.'
  }

  if (hasAny(q, ['moodnutri', 'android', 'kotlin', 'receta'])) {
    return 'MoodNutri es una app Android en Kotlin + Jetpack Compose con arquitectura MVI. Usa Gemini API para reconocer ingredientes desde imágenes y OpenAI API para generar recetas según estado de ánimo. También usa Room/DataStore y diseño claro/oscuro.'
  }

  if (hasAny(q, ['series tracker', 'series', 'swagger'])) {
    return 'Series Tracker es un microservicio REST en Go con SQLite, búsqueda, paginación, ratings, Swagger/OpenAPI embebido y deploy con Docker/Railway. Es un proyecto ligero para demostrar APIs claras y documentadas.'
  }

  if (hasAny(q, ['retailmax', 'metabase', 'dashboard', 'bi', 'analytics'])) {
    return 'RetailMax es un dashboard de data analytics con PostgreSQL, Metabase y Docker. Expone KPIs de negocio como ingresos, canales, márgenes, regiones, crecimiento de clientes y recompra.'
  }

  if (hasAny(q, ['gargantua', 'rust', 'graficas', 'proyecto2-graf', 'endurance', 'interstellar'])) {
    return 'Gargantua es su proyecto de Gráficas por Computadora: un agujero negro de Schwarzschild renderizado 100 % en CPU con Rust, sin librerías de gráficos ni de cálculo (solo minifb para la ventana). Integra geodésicas de luz con RK4, gas volumétrico con Doppler y corrimiento gravitacional, y una versión Endurance con la nave de Interstellar hecha con SDF, seis materiales con reflexión y refracción y render paralelo con hilos propios. Repo: https://github.com/Lazaroo1/Proyecto2-graf'
  }

  if (hasAny(q, ['blackhole', 'agujero negro', 'shader', 'webgl', 'raymarching', 'fondo', 'lineas'])) {
    return 'La parte visual del sitio está hecha con shaders. El fondo usa ondas senoidales por píxel para crear líneas fluidas. El blackhole usa WebGL, raymarching, framebuffers, blur y bloom para simular una lente gravitacional inspirada en Sgr A*. No son imágenes ni GIFs: todo se calcula en tiempo real en la GPU.'
  }

  if (hasAny(q, ['cv', 'practica', 'trabajo', 'oportunidad', 'freelance', 'contratar'])) {
    return 'Lázaro está disponible para prácticas, posiciones full stack y proyectos interesantes. Su perfil encaja especialmente bien con roles de frontend engineering, full stack, bases de datos, apps con IA y productos donde importe una UI limpia y una arquitectura seria.'
  }

  return 'Puedo responder sobre Lázaro, su stack, proyectos, experiencia, contacto o cómo está construido este portafolio. Pregúntame por ejemplo: “¿cuál es su proyecto más fuerte?”, “¿qué stack maneja?” o “¿cómo hizo el blackhole?”.'
}

export default function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de Lázaro. Pregúntame por sus proyectos, stack, experiencia o contacto.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    const localAnswer = getLocalPortfolioAnswer(userMessage)
    const history = messages
      .filter(message => message.content.trim())
      .slice(-8)
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const proxyUrl = import.meta.env.VITE_CHAT_PROXY_URL

      if (!proxyUrl) {
        await new Promise(resolve => window.setTimeout(resolve, 120))
        setMessages(prev => [...prev, { role: 'assistant', content: localAnswer }])
        return
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      })
      const data = await response.json() as ChatProxyResponse
      const reply = data.reply?.trim()

      if (!response.ok || !reply) {
        if (data.error || data.details) {
          console.warn('Chat proxy fallback:', data.error, data.details)
        }
        // Límite de mensajes del worker: se avisa y mientras tanto contesta la versión local
        const content = response.status === 429
          ? `Vas muy rápido; dame un minuto para volver a usar Gemini. Mientras tanto:\n\n${localAnswer}`
          : localAnswer
        setMessages(prev => [...prev, { role: 'assistant', content }])
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: toPlainText(reply) }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: localAnswer }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="chatbot-shell fixed bottom-24 sm:bottom-8 right-6 z-[120] w-14 h-14 rounded-full bg-white text-[#0a0a0a] shadow-2xl flex items-center justify-center"
            style={{ pointerEvents: 'all' }}
            aria-label="Abrir chat"
          >
            <Bot size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            // En teléfono va a lo ancho y nunca más alto que la pantalla (si no, la X quedaba fuera)
            className="chatbot-shell fixed left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-8 z-[120] sm:w-[380px] h-[min(500px,calc(100dvh_-_1.5rem))] sm:h-[min(500px,calc(100dvh_-_4rem))] bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161616] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white leading-tight">
                    Asistente de Lázaro
                  </p>
                  <p className="font-mono text-[10px] text-white/30 leading-tight">
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/30 hover:text-white transition-colors p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white text-[#0a0a0a] rounded-br-sm'
                      : 'bg-white/5 text-white/80 border border-white/10 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/10 bg-[#161616] shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Pregunta sobre Lázaro..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 font-body resize-none outline-none focus:border-white/25 transition-colors"
                  style={{ maxHeight: '80px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-white text-[#0a0a0a] flex items-center justify-center disabled:opacity-30 hover:bg-white/90 transition-all shrink-0 mb-0.5"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="hidden sm:block font-mono text-[10px] text-white/15 text-center mt-2">
                Enter para enviar · Shift+Enter para nueva línea
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
