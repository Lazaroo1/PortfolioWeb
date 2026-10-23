import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'

type OrientationPermissionApi = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

// Algunos navegadores de teléfono (Safari en iPhone) solo entregan el giroscopio después de pedir
// permiso con un toque. El botón aparece solo en pantallas táctiles con HTTPS, cuando el permiso
// existe y el giroscopio no ha mandado datos por su cuenta; en compu nunca aparece
export default function MotionPermissionButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const api = window.DeviceOrientationEvent as unknown as OrientationPermissionApi | undefined
    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (
      !api ||
      typeof api.requestPermission !== 'function' ||
      !touchScreen ||
      reducedMotion ||
      !window.isSecureContext
    ) {
      return undefined
    }

    let gotData = false
    const hideOnData = (event: DeviceOrientationEvent) => {
      if (event.beta === null) return
      gotData = true
      setVisible(false)
    }
    window.addEventListener('deviceorientation', hideOnData)
    // Si en un segundo no llegó nada, hace falta pedir permiso
    const timer = window.setTimeout(() => {
      if (!gotData) setVisible(true)
    }, 1000)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('deviceorientation', hideOnData)
    }
  }, [])

  if (!visible) return null

  const requestMotion = async () => {
    const api = window.DeviceOrientationEvent as unknown as OrientationPermissionApi
    try {
      await api.requestPermission?.()
    } catch {
      // Si lo niega o falla, el fondo sigue funcionando con el dedo
    }
    setVisible(false)
  }

  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={requestMotion}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-[11px] text-white/60 transition-colors hover:border-white/30 hover:text-white"
      >
        <Smartphone size={13} />
        Mover el fondo con el teléfono
      </button>
    </div>
  )
}
