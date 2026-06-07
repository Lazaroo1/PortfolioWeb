import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Github, Linkedin, Copy, Check } from 'lucide-react'
import { OWNER } from '@/data/portfolio'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    await navigator.clipboard.writeText(OWNER.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      id="contact"
      className="py-24 sm:py-32 px-6"
      style={{ position: 'relative', zIndex: 10 }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/75 -z-10" />
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-xs text-white tracking-widest uppercase mb-4">
            04 / Contacto
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#e8e8e8] mb-4">
            Hablemos.
          </h2>
          <p className="font-body text-[#666] mb-12 max-w-md mx-auto">
            Disponible para prácticas, posiciones full stack y proyectos interesantes.
          </p>

          {/* Email */}
          <button
            onClick={copyEmail}
            className="inline-flex max-w-full items-center gap-3 border border-[#1f1f1f] hover:border-white/40 bg-[#111]/50 rounded-xl px-4 sm:px-6 py-4 mb-8 transition-colors group"
          >
            <Mail size={16} className="text-white" />
            <span className="font-mono text-sm text-[#e8e8e8] break-all">{OWNER.email}</span>
            {copied ? (
              <Check size={14} className="text-white" />
            ) : (
              <Copy size={14} className="text-[#444] group-hover:text-[#666] transition-colors" />
            )}
          </button>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={OWNER.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-display text-sm text-[#666] hover:text-[#e8e8e8] border border-[#1f1f1f] hover:border-[#333] px-5 py-2.5 rounded-full transition-colors"
            >
              <Github size={15} />
              GitHub
            </a>
            <a
              href={OWNER.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-display text-sm text-[#666] hover:text-[#e8e8e8] border border-[#1f1f1f] hover:border-[#333] px-5 py-2.5 rounded-full transition-colors"
            >
              <Linkedin size={15} />
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="mt-24 pt-8 text-center">
        <p className="font-mono text-xs text-[#333]">
          Lázaro Daniel Díaz Bojórquez © {new Date().getFullYear()} · Guatemala
        </p>
      </div>
    </section>
  )
}
