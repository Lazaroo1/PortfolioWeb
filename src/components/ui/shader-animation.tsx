import { useEffect, useRef, useState } from 'react'

const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

// highp cuando el GPU lo soporta: en mediump (16 bits en muchos teléfonos) el fbm llega a valores
// de ~700 que se redondean en escalones y las ondas se ven cuadradas; en desktop mediump ya era 32 bits
const fragmentShaderSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  // 0 sin puntero; hasta 1 mientras el mouse (compu) o el giroscopio (teléfono) están activos
  uniform float u_pull;

  float noise(vec2 p) {
    return sin(p.x * 2.3 + u_time * 0.3) *
           sin(p.y * 1.7 + u_time * 0.2) * 0.5 + 0.5;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 4; i++) {
      v += a * (sin(p.x * 1.5 + u_time * 0.25 + float(i) * 0.8) *
               sin(p.y * 0.8 + u_time * 0.15) * 0.5 + 0.5);
      p = p * 2.0 + shift;
      a *= 0.45;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    // Mouse influence
    vec2 mouse = u_mouse;
    float mouseDist = length(uv - mouse * vec2(u_resolution.x / u_resolution.y, 1.0));

    // Las ondas se doblan hacia el puntero: cerca de él, la altura se estira hacia la suya.
    // Con u_pull = 0 no cambia nada
    vec2 toMouse = uv - mouse * vec2(u_resolution.x / u_resolution.y, 1.0);
    float pull = u_pull * exp(-toMouse.x * toMouse.x * 4.0 - toMouse.y * toMouse.y * 2.5);
    uv.y += toMouse.y * pull * 0.9;

    // Ondas horizontales con distorsion
    float wave1 = sin(uv.x * 3.0 + u_time * 0.4 + fbm(uv * 1.5) * 2.0) * 0.5 + 0.5;
    float wave2 = sin(uv.x * 2.0 - u_time * 0.3 + fbm(uv * 2.0 + vec2(5.0)) * 1.5) * 0.5 + 0.5;
    float wave3 = sin(uv.x * 4.0 + u_time * 0.5 + fbm(uv * 1.0 + vec2(2.0)) * 3.0) * 0.5 + 0.5;

    // Bandas horizontales
    float band1 = smoothstep(0.0, 0.15, abs(uv.y - wave1 * 0.6 - 0.2)) ;
    band1 = 1.0 - band1;
    float band2 = smoothstep(0.0, 0.12, abs(uv.y - wave2 * 0.5 - 0.4));
    band2 = 1.0 - band2;
    float band3 = smoothstep(0.0, 0.1, abs(uv.y - wave3 * 0.4 - 0.6));
    band3 = 1.0 - band3;

    float glow = (band1 * 0.6 + band2 * 0.5 + band3 * 0.4);

    // Mouse interaction
    glow += smoothstep(0.3, 0.0, mouseDist) * 0.15;

    // Color: gris profundo -> plata -> blanco neon
    vec3 darkSilver = vec3(0.025, 0.03, 0.035);
    vec3 midSilver = vec3(0.38, 0.42, 0.46);
    vec3 brightSilver = vec3(0.88, 0.95, 1.0);

    vec3 col = darkSilver;
    col = mix(col, midSilver, glow * 0.8);
    col = mix(col, brightSilver, pow(glow, 3.0) * 0.75);

    // Fondo muy oscuro
    col = mix(vec3(0.015, 0.016, 0.018), col, glow * 1.25 + 0.05);

    gl_FragColor = vec4(col, 1.0);
  }
`

// Todas las velocidades del shader (0.15, 0.2, 0.25, 0.3, 0.4, 0.5) dan vueltas completas
// en 40π segundos, así que el tiempo puede reiniciarse ahí sin ningún salto visible
const TIME_PERIOD = 40 * Math.PI
// Salta frames a menos de 9.5 ms del anterior: en pantallas de 120 Hz queda en 60 fps y a 60 Hz no cambia nada
const MIN_FRAME_INTERVAL_MS = 9.5
// En pantallas táctiles el fondo va a 30 fps y a 1 muestra por píxel CSS: son degradados suaves que se
// mueven lento, y a resolución completa en highp le quitaba al teléfono el GPU que necesita para responder
const TOUCH_MIN_FRAME_INTERVAL_MS = 26
const TOUCH_PIXEL_RATIO = 1

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

const clampTilt = (value: number) => Math.max(-0.5, Math.min(0.5, value))

export default function ShaderAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  // Cambia cuando el navegador restaura un contexto WebGL perdido, para volver a montar el shader
  const [glGeneration, setGlGeneration] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    // Sin antialias: el shader llena toda la pantalla, el MSAA solo gastaba memoria
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    })

    if (!gl) return undefined

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) return undefined

    const program = gl.createProgram()
    if (!program) return undefined

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return undefined
    }

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse')
    const pullLocation = gl.getUniformLocation(program, 'u_pull')
    const buffer = gl.createBuffer()

    if (!buffer) return undefined

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    const root = document.documentElement
    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    const minFrameInterval = touchScreen ? TOUCH_MIN_FRAME_INTERVAL_MS : MIN_FRAME_INTERVAL_MS
    let lastDrawAt = 0
    let contextLost = false
    // Reloj de la animación: no avanza mientras el fondo está tapado, así al volver sigue donde se quedó
    let pausedSince: number | null = null
    let pausedFor = 0
    const clock = (now: number) => now - pausedFor - (pausedSince === null ? 0 : now - pausedSince)

    // Puntero que dobla las ondas: a dónde va (target) y dónde está ya suavizado (pointer).
    // Con "reducir movimiento" activado en el sistema, las ondas no reaccionan
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = { x: 0.5, y: 0.5, pull: 0 }
    const pointer = { x: 0.5, y: 0.5, pull: 0 }
    let lastEaseAt = 0
    let tiltRest: number | null = null

    const aimAt = (x: number, y: number, pull: number) => {
      target.x = x
      target.y = y
      target.pull = reducedMotion ? 0 : pull
    }

    // Inercia: la posición alcanza al puntero en ~0.2 s y la intensidad entra y sale en ~0.4 s
    const ease = (time: number) => {
      const dt = lastEaseAt ? Math.min(0.1, (time - lastEaseAt) / 1000) : 0
      lastEaseAt = time
      const follow = 1 - Math.exp(-dt * 5)
      const fade = 1 - Math.exp(-dt * 2.5)
      pointer.x += (target.x - pointer.x) * follow
      pointer.y += (target.y - pointer.y) * follow
      pointer.pull += (target.pull - pointer.pull) * fade
    }

    const draw = (time: number) => {
      ease(time)
      gl.useProgram(program)
      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.uniform1f(timeLocation, (time * 0.001) % TIME_PERIOD)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseLocation, pointer.x, pointer.y)
      gl.uniform1f(pullLocation, pointer.pull)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    // Solo reasigna el buffer cuando el canvas cambia de tamaño de verdad. El canvas mide 100vh
    // (el alto grande del viewport), así que la barra del navegador del teléfono no lo mueve
    const resize = () => {
      const pixelRatio = touchScreen ? TOUCH_PIXEL_RATIO : Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio))
      const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio))

      if (canvas.width === width && canvas.height === height) return

      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      // Cambiar el tamaño del canvas lo borra: dibujar de una vez evita un frame en negro
      if (!contextLost) draw(clock(performance.now()))
    }

    const handleMouseMove = (event: MouseEvent) => {
      aimAt(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, 1)
    }

    // El mouse salió de la ventana: las ondas regresan solas
    const handleMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) target.pull = 0
    }

    // Giroscopio (solo llega en HTTPS; en iPhone, después de dar permiso). La postura en que
    // sostienes el teléfono cuenta como el centro, y se vuelve a centrar despacio si cambias de postura
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return

      const angle = screen.orientation?.angle ?? 0
      let tiltX = event.gamma
      let tiltY = event.beta
      if (angle === 90) {
        tiltX = event.beta
        tiltY = -event.gamma
      } else if (angle === 270) {
        tiltX = -event.beta
        tiltY = event.gamma
      }

      tiltRest = tiltRest === null ? tiltY : tiltRest + (tiltY - tiltRest) * 0.01
      aimAt(0.5 + clampTilt(tiltX / 40), 0.5 - clampTilt((tiltY - tiltRest) / 40), 0.85)
    }

    const render = (time: number) => {
      animationRef.current = window.requestAnimationFrame(render)
      // Con el blackhole en pantalla completa o un proyecto abierto el fondo casi no se ve
      // (queda detrás del oscurecido y el difuminado): no gastar GPU en él
      if (root.classList.contains('blackhole-expanded') || root.classList.contains('project-modal-open')) {
        if (pausedSince === null) pausedSince = time
        return
      }
      if (pausedSince !== null) {
        pausedFor += time - pausedSince
        pausedSince = null
      }
      if (time - lastDrawAt < minFrameInterval) return

      lastDrawAt = time
      draw(clock(time))
    }

    const handleContextLost = (event: Event) => {
      // preventDefault avisa al navegador que queremos recuperar el contexto
      event.preventDefault()
      contextLost = true
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current)
    }

    const handleContextRestored = () => {
      setGlGeneration((value) => value + 1)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()
    // En la compu las ondas siguen al mouse y en el teléfono solo al giroscopio. Los toques también
    // disparan eventos de mouse, por eso el mouse solo cuenta cuando el puntero principal no es táctil
    if (touchScreen) {
      window.addEventListener('deviceorientation', handleOrientation)
    } else {
      window.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseout', handleMouseOut)
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    animationRef.current = window.requestAnimationFrame(render)

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current)
      }

      resizeObserver.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseout', handleMouseOut)
      window.removeEventListener('deviceorientation', handleOrientation)
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)

      // Con el contexto perdido los objetos ya no existen: no hay nada que liberar
      if (contextLost) return

      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [glGeneration])

  return (
    <canvas
      ref={canvasRef}
      className="fixed left-0 top-0 h-screen w-full"
      style={{ zIndex: -1, pointerEvents: 'none' }}
    />
  )
}
