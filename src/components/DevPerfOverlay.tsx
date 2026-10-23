import { useEffect, useState } from 'react'

// Solo en desarrollo y con ?debug en la URL (ver App.tsx): mide en el teléfono real lo que no se
// puede medir desde la compu. Nunca entra al build de producción
type Stats = {
  fps: number
  longTasks: number
  longestTask: number
  slowestTap: number
  lastTap: number
  gyro: string
  gpu: string
  parallelCompile: boolean
}

export default function DevPerfOverlay() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let frames = 0
    let longTasks = 0
    let longestTask = 0
    let slowestTap = 0
    let lastTap = 0
    let gyro = 'sin datos'

    const gl = document.createElement('canvas').getContext('webgl2')
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    const gpu = gl ? String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : 'sin WebGL2'
    const parallelCompile = Boolean(gl?.getExtension('KHR_parallel_shader_compile'))

    let raf = 0
    const countFrame = () => {
      frames += 1
      raf = requestAnimationFrame(countFrame)
    }
    raf = requestAnimationFrame(countFrame)

    const observers: PerformanceObserver[] = []
    const observe = (type: string, onEntry: (entry: PerformanceEntry) => void, extra = {}) => {
      try {
        const observer = new PerformanceObserver((list) => list.getEntries().forEach(onEntry))
        observer.observe({ type, buffered: true, ...extra } as PerformanceObserverInit)
        observers.push(observer)
      } catch {
        // El navegador no soporta ese tipo de medición
      }
    }

    observe('longtask', (entry) => {
      longTasks += 1
      longestTask = Math.max(longestTask, entry.duration)
    })
    // Cuánto tardó cada toque/clic desde que tocaste hasta que la página respondió
    observe(
      'event',
      (entry) => {
        if (!['pointerdown', 'pointerup', 'click'].includes(entry.name)) return
        lastTap = entry.duration
        slowestTap = Math.max(slowestTap, entry.duration)
      },
      { durationThreshold: 16 },
    )

    const onOrientation = (event: DeviceOrientationEvent) => {
      gyro = event.beta === null ? 'evento sin datos' : `β ${event.beta.toFixed(0)}° γ ${event.gamma?.toFixed(0)}°`
    }
    window.addEventListener('deviceorientation', onOrientation)

    const interval = window.setInterval(() => {
      setStats({ fps: frames, longTasks, longestTask, slowestTap, lastTap, gyro, gpu, parallelCompile })
      frames = 0
    }, 1000)

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(interval)
      observers.forEach((observer) => observer.disconnect())
      window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [])

  if (!stats) return null

  return (
    <div className="pointer-events-none fixed left-2 top-2 z-[200] max-w-[calc(100vw-1rem)] rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-relaxed text-lime-300">
      <div>fps {stats.fps} · dpr {window.devicePixelRatio.toFixed(2)} · {window.isSecureContext ? 'https/local' : 'http (sin giroscopio)'}</div>
      <div>tareas largas {stats.longTasks} · la peor {stats.longestTask.toFixed(0)} ms</div>
      <div>último toque {stats.lastTap.toFixed(0)} ms · el más lento {stats.slowestTap.toFixed(0)} ms</div>
      <div>giroscopio: {stats.gyro}</div>
      <div className="truncate">gpu: {stats.gpu} · compilación paralela {stats.parallelCompile ? 'sí' : 'no'}</div>
    </div>
  )
}
