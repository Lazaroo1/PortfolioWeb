import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export enum Tag {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  P = 'p',
  SPAN = 'span',
  DIV = 'div',
}

type VaporizeDirection =
  | 'left-to-right'
  | 'right-to-left'
  | 'top-to-bottom'
  | 'bottom-to-top'
  | 'center-out'
  | 'random'

type TextAlignment = 'left' | 'center' | 'right'

interface VaporizeTextCycleProps {
  texts: string[]
  font?: CSSProperties
  color?: string
  spread?: number
  density?: number
  animation?: {
    vaporizeDuration?: number
    fadeInDuration?: number
    waitDuration?: number
  }
  direction?: VaporizeDirection
  alignment?: TextAlignment
  tag?: Tag
  className?: string
}

type Phase = 'entering' | 'waiting' | 'leaving'

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function getOrder(index: number, total: number, direction: VaporizeDirection) {
  if (total <= 1) return 0
  if (direction === 'right-to-left' || direction === 'bottom-to-top') {
    return (total - index - 1) / (total - 1)
  }
  if (direction === 'center-out') {
    return Math.abs(index - (total - 1) / 2) / ((total - 1) / 2)
  }
  if (direction === 'random') {
    return seededRandom(index + total)
  }
  return index / (total - 1)
}

function getTravel(index: number, total: number, spread: number, density: number, direction: VaporizeDirection) {
  const distance = 8 + spread * 8 + density * 1.8
  const drift = (seededRandom(index + 17) - 0.5) * distance
  const lift = -distance * (0.6 + seededRandom(index + 31) * 0.8)

  if (direction === 'right-to-left') return { x: -distance - Math.abs(drift), y: lift }
  if (direction === 'top-to-bottom') return { x: drift, y: distance }
  if (direction === 'bottom-to-top') return { x: drift, y: -distance }
  if (direction === 'center-out') {
    const center = (total - 1) / 2
    const side = index >= center ? 1 : -1
    return { x: side * distance + drift, y: lift }
  }
  if (direction === 'random') {
    return {
      x: (seededRandom(index + 71) - 0.5) * distance * 2,
      y: (seededRandom(index + 97) - 0.7) * distance * 1.6,
    }
  }
  return { x: distance + Math.abs(drift), y: lift }
}

export default function VaporizeTextCycle({
  texts,
  font,
  color = 'currentColor',
  spread = 3,
  density = 6,
  animation,
  direction = 'left-to-right',
  alignment = 'center',
  tag = Tag.SPAN,
  className,
}: VaporizeTextCycleProps) {
  const safeTexts = texts.length > 0 ? texts : ['']
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('entering')

  const vaporizeDuration = animation?.vaporizeDuration ?? 1.6
  const fadeInDuration = animation?.fadeInDuration ?? 0.7
  const waitDuration = animation?.waitDuration ?? 1.4
  const currentText = safeTexts[index % safeTexts.length]
  const chars = useMemo(() => Array.from(currentText), [currentText])
  const particlesPerChar = Math.max(1, Math.min(3, Math.round(density / 3)))
  const TagName = tag as keyof JSX.IntrinsicElements

  useEffect(() => {
    const timers: number[] = []

    if (phase === 'entering') {
      timers.push(window.setTimeout(() => setPhase('waiting'), fadeInDuration * 1000))
    }

    if (phase === 'waiting' && safeTexts.length > 1) {
      timers.push(window.setTimeout(() => setPhase('leaving'), waitDuration * 1000))
    }

    if (phase === 'leaving') {
      timers.push(
        window.setTimeout(() => {
          setIndex((value) => (value + 1) % safeTexts.length)
          setPhase('entering')
        }, vaporizeDuration * 1000),
      )
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [fadeInDuration, phase, safeTexts.length, vaporizeDuration, waitDuration])

  return (
    <TagName
      className={cn('relative block w-full overflow-visible leading-none', className)}
      style={{
        ...font,
        color,
        textAlign: alignment,
      }}
    >
      <span className="sr-only">{currentText}</span>
      <span aria-hidden="true" className="inline-flex justify-center whitespace-nowrap">
        {chars.map((char, charIndex) => {
          const order = getOrder(charIndex, chars.length, direction)
          const travel = getTravel(charIndex, chars.length, spread, density, direction)
          const delay = phase === 'leaving' ? order * 0.45 : order * 0.16
          const readableChar = char === ' ' ? '\u00A0' : char

          return (
            <motion.span
              key={`${index}-${charIndex}-${char}`}
              className="relative inline-block"
              initial={{ opacity: 0, y: 10, filter: `blur(${Math.max(3, spread)}px)` }}
              animate={
                phase === 'leaving'
                  ? {
                      opacity: 0,
                      x: travel.x,
                      y: travel.y,
                      filter: `blur(${Math.max(6, spread * 2)}px)`,
                    }
                  : {
                      opacity: 1,
                      x: 0,
                      y: 0,
                      filter: 'blur(0px)',
                    }
              }
              transition={{
                duration: phase === 'leaving' ? vaporizeDuration : fadeInDuration,
                delay,
                ease: 'easeOut',
              }}
            >
              {readableChar}
              {phase === 'leaving' &&
                Array.from({ length: particlesPerChar }).map((_, particleIndex) => {
                  const particleSeed = charIndex * 13 + particleIndex * 7
                  const particleTravel = getTravel(
                    particleSeed,
                    chars.length + particlesPerChar,
                    spread + particleIndex,
                    density,
                    direction,
                  )

                  return (
                    <motion.span
                      key={particleIndex}
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0.55, x: 0, y: 0, scale: 1 }}
                      animate={{
                        opacity: 0,
                        x: particleTravel.x,
                        y: particleTravel.y,
                        scale: 0.3,
                        filter: `blur(${spread + particleIndex + 2}px)`,
                      }}
                      transition={{
                        duration: vaporizeDuration,
                        delay: delay + particleIndex * 0.04,
                        ease: 'easeOut',
                      }}
                    >
                      {readableChar}
                    </motion.span>
                  )
                })}
            </motion.span>
          )
        })}
      </span>
    </TagName>
  )
}
