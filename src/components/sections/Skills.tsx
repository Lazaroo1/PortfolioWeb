import type { ElementType } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Server, Database, Cloud, Smartphone, Brain } from 'lucide-react'
import { SKILLS } from '@/data/portfolio'

const ICON_MAP: Record<string, ElementType> = {
  monitor: Monitor, server: Server, database: Database,
  cloud: Cloud, smartphone: Smartphone, brain: Brain,
}

export default function Skills() {
  return (
    <section
      id="skills"
      className="py-24 sm:py-32 px-6"
      style={{ position: 'relative', zIndex: 'auto' }}
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-xs text-white tracking-widest uppercase mb-4">
            Tecnologías
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#e8e8e8] mb-16">
            El stack.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILLS.map((group, i) => {
              const Icon = ICON_MAP[group.icon] || Monitor
              return (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-[#1f1f1f] rounded-xl p-5 hover:border-white/20 transition-colors bg-[#111]/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon size={16} className="text-white" />
                    </div>
                    <h3 className="font-display font-semibold text-sm text-[#e8e8e8]">
                      {group.category}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-neutral-900/60 border border-neutral-800/80 text-xs font-medium text-neutral-400 tracking-wide rounded-md px-2.5 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
