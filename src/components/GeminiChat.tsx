import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_CONTEXT = `Eres el asistente de portafolio de Lázaro Daniel Díaz Bojórquez.
Responde preguntas sobre él de forma amigable, concisa y en el idioma del usuario.

Datos de Lázaro:
- Full Stack Engineer, estudiante CS en UVG Guatemala, 5° semestre
- Email: ldbojorquez@gmail.com | GitHub: github.com/Lazaroo1
- Stack: React, TypeScript, Vue 3, Node.js, PostgreSQL, Docker, GitHub Actions
- También: Go, Kotlin, Jetpack Compose, Firebase, FastAPI, Laravel
- Proyectos:
  * Bodega de Licores: sistema empresarial Vue 3 + Node.js + PostgreSQL, RBAC con Clerk, 316 tests Jest, CI/CD, Docker. Repo privado.
  * OmniMarket: tienda retail React + Node.js + PostgreSQL, SQL avanzado visible en UI, transacciones ACID, reportes PDF
  * MoodNutri: app Android Kotlin + Jetpack Compose, Gemini API para reconocer ingredientes, OpenAI para recetas
  * Series Tracker: API REST en Go + SQLite, Swagger/OpenAPI embebido, deploy en Railway
- Disponible para: prácticas, posiciones full stack, proyectos freelance
- Inglés B2, Español nativo
Solo responde sobre Lázaro. Si preguntan algo no relacionado, redirige amablemente.`

export default function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de Lázaro. ¿Qué te gustaría saber sobre él o su trabajo?',
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
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: SYSTEM_CONTEXT + '\n\nPregunta del usuario: ' + userMessage }],
            }],
            generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
          }),
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Lo siento, no pude generar una respuesta.'
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Intenta de nuevo.',
      }])
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
            className="fixed bottom-24 sm:bottom-8 right-6 z-50 w-14 h-14 rounded-full bg-white text-[#0a0a0a] shadow-2xl flex items-center justify-center"
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
            className="fixed bottom-24 sm:bottom-8 right-6 z-50 w-[340px] sm:w-[380px] h-[500px] bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed ${
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
              <p className="font-mono text-[10px] text-white/15 text-center mt-2">
                Enter para enviar · Shift+Enter para nueva línea
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
