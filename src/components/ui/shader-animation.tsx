import { useEffect, useRef } from 'react'

const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  
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

export default function ShaderAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
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
    const buffer = gl.createBuffer()

    if (!buffer) return undefined

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(window.innerWidth * pixelRatio))
      const height = Math.max(1, Math.floor(window.innerHeight * pixelRatio))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      gl.viewport(0, 0, width, height)
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: event.clientX / window.innerWidth,
        y: 1 - event.clientY / window.innerHeight,
      }
    }

    const render = (time: number) => {
      resize()
      gl.useProgram(program)
      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.uniform1f(timeLocation, time * 0.001)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      animationRef.current = window.requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    animationRef.current = window.requestAnimationFrame(render)

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current)
      }

      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: -1, pointerEvents: 'none' }}
    />
  )
}
