import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Home, User, Briefcase, Layers, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/data/portfolio'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

const NAV_ICONS = [Home, User, Briefcase, Layers, Mail]

const navItemsWithIcons: NavItem[] = NAV_ITEMS.map((item, i) => ({
  name: item.name,
  href: item.href,
  icon: NAV_ICONS[i],
}))

interface NavBarProps {
  activeSection?: string
  className?: string
}

export function NavBar({ activeSection, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(navItemsWithIcons[0].name)

  useEffect(() => {
    if (activeSection) {
      const match = navItemsWithIcons.find(
        item => item.href === `#${activeSection}`
      )
      if (match) setActiveTab(match.name)
    }
  }, [activeSection])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, name: string) => {
    e.preventDefault()
    setActiveTab(name)
    const targetId = href.replace('#', '')
    const el = document.getElementById(targetId)
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6',
        className,
      )}
    >
      <div className="flex items-center gap-1 bg-[#0a0a0a]/80 border border-[#1f1f1f] backdrop-blur-xl py-1 px-1 rounded-full shadow-2xl">
        {navItemsWithIcons.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleClick(e, item.href, item.name)}
              className={cn(
                'relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors duration-200 font-display',
                'text-[#666] hover:text-[#e8e8e8]',
                isActive && 'text-white',
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-white/5 rounded-full -z-10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-t-full">
                    <div className="absolute w-12 h-6 bg-white/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-white/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-white/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
