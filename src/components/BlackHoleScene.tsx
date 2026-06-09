import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const BUFFER_A_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;

out vec4 fragColor;

#define ITERATIONS 130

const float pi = 3.14159265;
const vec3 MainColor = vec3(1.0);

float saturateF(float x) { return clamp(x, 0.0, 1.0); }
vec3 saturateV(vec3 x) { return clamp(x, vec3(0.0), vec3(1.0)); }

float rand2(vec2 c) {
  return saturateF(fract(sin(dot(c, vec2(12.9898, 78.223))) * 43758.5453));
}

float noise(in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
  vec2 rg = textureLod(iChannel0, (uv + 0.5) / 256.0, 0.0).yx;
  return -1.0 + 2.0 * mix(rg.x, rg.y, f.z);
}

float pcurve(float x, float a, float b) {
  float k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
  return k * pow(x, a) * pow(1.0 - x, b);
}

float myAtan2(float y, float x) {
  if (x > 0.0) return atan(y / x);
  if (x == 0.0) {
    if (y > 0.0) return pi / 2.0;
    if (y < 0.0) return -pi / 2.0;
    return 0.0;
  }
  if (y >= 0.0) return atan(y / x) + pi;
  return atan(y / x) - pi;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

void Haze(inout vec3 color, vec3 pos, float alpha) {
  float d = length(sdTorus(pos + vec3(0.0, -0.05, 0.0), vec2(1.0, 0.01)));
  float b = 1.0 / (d * d + 0.001);
  b *= length(pos) < 0.5 ? 0.0 : 1.0;
  color += MainColor * b * (2.9 / float(ITERATIONS)) * (1.0 - alpha);
}

void GasDisc(inout vec3 color, inout float alpha, vec3 pos) {
  float discRadius = 3.2;
  float discWidth = 5.3;
  float discInner = discRadius - discWidth * 0.5;
  vec3 discNormal = vec3(0.0, 1.0, 0.0);
  float discThickness = 0.1;
  float distC = length(pos);
  float distD = dot(discNormal, pos);
  float radGrad = 1.0 - saturateF((distC - discInner) / discWidth * 0.5);
  float cov = pcurve(radGrad, 4.0, 0.9);

  discThickness *= radGrad;
  cov *= saturateF(1.0 - abs(distD) / discThickness);

  float dustGlow = 1.0 / (pow(1.0 - radGrad, 2.0) * 290.0 + 0.002);
  vec3 dustColor = MainColor * dustGlow * 8.2;
  cov = saturateF(cov * 0.7);

  float fade = pow((abs(distC - discInner) + 0.4), 4.0) * 0.04;
  float bf = 1.0 / (pow(distD, 2.0) * 40.0 + fade + 0.00002);
  vec3 b = MainColor * pow(bf, 1.5);
  b *= mix(vec3(1.7, 1.1, 1.0), vec3(0.5, 0.6, 1.0), vec3(pow(radGrad, 2.0)));
  b *= mix(vec3(1.7, 0.5, 0.1), vec3(1.0), vec3(pow(radGrad, 0.5)));
  dustColor = mix(dustColor, b * 150.0, saturateF(1.0 - cov));
  cov = saturateF(cov + bf * bf * 0.1);

  if (cov < 0.01) return;

  vec3 rc;
  rc.x = distC * 1.5 + 0.55;
  rc.y = myAtan2(-pos.x, -pos.z) * 1.5;
  rc.z = distD * 1.5;
  rc *= 0.95;

  float spd = 0.06;
  float n1 = 1.0;
  vec3 rcc = rc;
  rcc.y += iTime * spd; n1 *= noise(rcc * 3.0) * 0.5 + 0.5;
  rcc.y -= iTime * spd; n1 *= noise(rcc * 6.0) * 0.5 + 0.5;
  rcc.y += iTime * spd; n1 *= noise(rcc * 12.0) * 0.5 + 0.5;
  rcc.y -= iTime * spd; n1 *= noise(rcc * 24.0) * 0.5 + 0.5;

  float n2 = 2.0;
  rcc = rc + 30.0;
  rcc.y += iTime * spd; n2 *= noise(rcc * 3.0) * 0.5 + 0.5;
  rcc.y -= iTime * spd; n2 *= noise(rcc * 6.0) * 0.5 + 0.5;
  rcc.y += iTime * spd; n2 *= noise(rcc * 12.0) * 0.5 + 0.5;
  rcc.y -= iTime * spd; n2 *= noise(rcc * 24.0) * 0.5 + 0.5;
  rcc.y += iTime * spd; n2 *= noise(rcc * 48.0) * 0.5 + 0.5;
  rcc.y -= iTime * spd; n2 *= noise(rcc * 92.0) * 0.5 + 0.5;

  dustColor *= n1 * 0.998 + 0.002;
  cov *= n2;
  rc.y += iTime * spd * 0.5;
  dustColor *= pow(texture(iChannel1, rc.yx * vec2(0.15, 0.27)).rgb, vec3(2.0)) * 4.0;
  cov = saturateF(cov * 1200.0 / float(ITERATIONS));
  dustColor = max(vec3(0.0), dustColor);
  cov *= pcurve(radGrad, 4.0, 0.9);
  color = (1.0 - alpha) * dustColor * cov + color;
  alpha = (1.0 - alpha) * cov + alpha;
}

mat3 Rx(float a) { return mat3(1,0,0, 0,cos(a),sin(a), 0,-sin(a),cos(a)); }
mat3 Ry(float a) { return mat3(cos(a),0,-sin(a), 0,1,0, sin(a),0,cos(a)); }
mat3 Rz(float a) { return mat3(cos(a),sin(a),0, -sin(a),cos(a),0, 0,0,1); }

void RotateCamera(inout vec3 ev, inout vec3 ep) {
  vec2 mp = iMouse.xy / iResolution.xy;
  if (mp.x == 0.0) mp.x = 0.35;
  vec3 angle = vec3(mp.y * 0.05 + 0.05, 1.0 + mp.x * 1.0, -0.45);
  ev = Rx(angle.x) * ev;
  ev = Rz(angle.z) * ev;
  ev = Ry(angle.y) * ev;
  ep = Rx(angle.x) * ep;
  ep = Rz(angle.z) * ep;
  ep = Ry(angle.y) * ep;
}

void WarpSpace(inout vec3 ev, vec3 rp) {
  float d = length(rp);
  float wf = 1.0 / (d * d + 0.000001);
  ev = normalize(ev + normalize(-rp) * wf * 5.0 / float(ITERATIONS));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy;
  float aspect = iResolution.x / iResolution.y;
  vec2 uveye = uv;
  uveye.x += rand2(uv + sin(iTime)) / iResolution.x;
  uveye.y += rand2(uv + 1.0 + sin(iTime)) / iResolution.y;

  vec3 eyevec = normalize(vec3((uveye * 2.0 - 1.0) * vec2(aspect, 1.0), 6.0));
  vec3 eyepos = vec3(0.0, 0.0, -10.0);
  vec2 mp = iMouse.xy / iResolution.xy;
  if (mp.x == 0.0) mp.x = 0.35;
  eyepos.x += mp.x * 3.0 - 1.5;
  RotateCamera(eyevec, eyepos);

  vec3 color = vec3(0.0);
  float alpha = 0.0;
  float dither = rand2(uv + sin(iTime)) * 2.0;
  vec3 raypos = eyepos + eyevec * dither * 15.0 / float(ITERATIONS);

  for (int i = 0; i < ITERATIONS; i++) {
    WarpSpace(eyevec, raypos);
    raypos += eyevec * 15.0 / float(ITERATIONS);
    GasDisc(color, alpha, raypos);
    Haze(color, raypos, alpha);
  }

  color *= 0.0001;
  vec3 previous = texture(iChannel2, uv).rgb;
  color = mix(color, previous, 0.88);
  fragColor = vec4(saturateV(color), 1.0);
}
`

const BUFFER_B_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform sampler2D iChannel0;

out vec4 fragColor;

vec3 Fetch(vec2 c) { return texture(iChannel0, c).rgb; }

vec2 Offs(float o) {
  vec2 pad = vec2(10.0) / iResolution.xy;
  vec2 off = vec2(0.0);
  off.x = -min(1.0, floor(o / 3.0)) * (0.25 + pad.x);
  off.y = -(1.0 - (1.0 / exp2(o))) - pad.y * o;
  off.y += min(1.0, floor(o / 3.0)) * 0.35;
  return off;
}

vec3 Grab(vec2 uv, float oct, vec2 offset, int N) {
  float sc = exp2(oct);
  uv = (uv + offset) * sc;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);
  if (N == 1) return Fetch(uv);

  vec3 col = vec3(0.0);
  float w = 0.0;
  float fn = float(N);

  for (int i = 0; i < 16; i++) {
    for (int j = 0; j < 16; j++) {
      if (float(i) >= fn || float(j) >= fn) continue;
      col += Fetch(uv + vec2(float(i), float(j)) / iResolution.xy * sc / fn);
      w += 1.0;
    }
  }

  return col / w;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy;
  vec3 c = vec3(0.0);
  c += Grab(uv, 1.0, vec2(0.0), 1);
  c += Grab(uv, 2.0, Offs(1.0), 4);
  c += Grab(uv, 3.0, Offs(2.0), 8);
  c += Grab(uv, 4.0, Offs(3.0), 16);
  c += Grab(uv, 5.0, Offs(4.0), 16);
  c += Grab(uv, 6.0, Offs(5.0), 16);
  c += Grab(uv, 7.0, Offs(6.0), 16);
  c += Grab(uv, 8.0, Offs(7.0), 16);
  fragColor = vec4(c, 1.0);
}
`

const BUFFER_C_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform sampler2D iChannel0;

out vec4 fragColor;

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy;

  if (uv.x >= 0.52) {
    fragColor = vec4(0.0);
    return;
  }

  float W[5];
  W[0] = 0.19638062;
  W[1] = 0.29675293;
  W[2] = 0.09442139;
  W[3] = 0.01037598;
  W[4] = 0.00025940;

  float O[5];
  O[0] = 0.0;
  O[1] = 1.41176471;
  O[2] = 3.29411765;
  O[3] = 5.17647059;
  O[4] = 7.05882353;

  vec3 col = texture(iChannel0, uv).rgb * W[0];
  float ws = W[0];

  for (int i = 1; i < 5; i++) {
    vec2 off = vec2(O[i], 0.0) / iResolution.xy * 0.5;
    col += texture(iChannel0, uv + off).rgb * W[i];
    col += texture(iChannel0, uv - off).rgb * W[i];
    ws += W[i] * 2.0;
  }

  fragColor = vec4(col / ws, 1.0);
}
`

const BUFFER_D_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform sampler2D iChannel0;

out vec4 fragColor;

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy;

  if (uv.x >= 0.52) {
    fragColor = vec4(0.0);
    return;
  }

  float W[5];
  W[0] = 0.19638062;
  W[1] = 0.29675293;
  W[2] = 0.09442139;
  W[3] = 0.01037598;
  W[4] = 0.00025940;

  float O[5];
  O[0] = 0.0;
  O[1] = 1.41176471;
  O[2] = 3.29411765;
  O[3] = 5.17647059;
  O[4] = 7.05882353;

  vec3 col = texture(iChannel0, uv).rgb * W[0];
  float ws = W[0];

  for (int i = 1; i < 5; i++) {
    vec2 off = vec2(0.0, O[i]) / iResolution.xy * 0.5;
    col += texture(iChannel0, uv + off).rgb * W[i];
    col += texture(iChannel0, uv - off).rgb * W[i];
    ws += W[i] * 2.0;
  }

  fragColor = vec4(col / ws, 1.0);
}
`

const IMAGE_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel3;

out vec4 fragColor;

vec3 sat(vec3 x) { return clamp(x, vec3(0.0), vec3(1.0)); }

vec4 cubic(float x) {
  float x2 = x * x;
  float x3 = x2 * x;
  return vec4(
    -x3 + 3.0 * x2 - 3.0 * x + 1.0,
    3.0 * x3 - 6.0 * x2 + 4.0,
    -3.0 * x3 + 3.0 * x2 + 3.0 * x + 1.0,
    x3
  ) / 6.0;
}

vec3 Bicubic(sampler2D tex, vec2 coord) {
  vec2 res = iResolution.xy;
  coord *= res;
  float fx = fract(coord.x);
  float fy = fract(coord.y);
  coord -= vec2(fx, fy);
  fx -= 0.5;
  fy -= 0.5;

  vec4 xc = cubic(fx);
  vec4 yc = cubic(fy);
  vec4 c = vec4(coord.x - 0.5, coord.x + 1.5, coord.y - 0.5, coord.y + 1.5);
  vec4 s = vec4(xc.x + xc.y, xc.z + xc.w, yc.x + yc.y, yc.z + yc.w);
  vec4 off = c + vec4(xc.y, xc.w, yc.y, yc.w) / s;

  vec3 s0 = texture(tex, vec2(off.x, off.z) / res).rgb;
  vec3 s1 = texture(tex, vec2(off.y, off.z) / res).rgb;
  vec3 s2 = texture(tex, vec2(off.x, off.w) / res).rgb;
  vec3 s3 = texture(tex, vec2(off.y, off.w) / res).rgb;
  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}

vec2 Offs(float o) {
  vec2 pad = vec2(10.0) / iResolution.xy;
  vec2 off = vec2(0.0);
  off.x = -min(1.0, floor(o / 3.0)) * (0.25 + pad.x);
  off.y = -(1.0 - (1.0 / exp2(o))) - pad.y * o;
  off.y += min(1.0, floor(o / 3.0)) * 0.35;
  return off;
}

vec3 Grab(vec2 uv, float oct, vec2 offset) {
  float sc = exp2(oct);
  uv = uv / sc - offset;
  return Bicubic(iChannel3, uv);
}

vec3 GetBloom(vec2 uv) {
  vec3 b = vec3(0.0);
  b += Grab(uv, 1.0, Offs(0.0)) * 1.0;
  b += Grab(uv, 2.0, Offs(1.0)) * 1.5;
  b += Grab(uv, 3.0, Offs(2.0)) * 1.0;
  b += Grab(uv, 4.0, Offs(3.0)) * 1.5;
  b += Grab(uv, 5.0, Offs(4.0)) * 1.8;
  b += Grab(uv, 6.0, Offs(5.0)) * 1.0;
  b += Grab(uv, 7.0, Offs(6.0)) * 1.0;
  b += Grab(uv, 8.0, Offs(7.0)) * 1.0;
  return b;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy;
  vec3 col = texture(iChannel0, uv).rgb;
  col += GetBloom(uv) * 0.08;
  col *= 200.0;
  col = pow(col, vec3(1.5));
  col = col / (1.0 + col);
  col = pow(col, vec3(1.0 / 1.5));
  col = mix(col, col * col * (3.0 - 2.0 * col), vec3(1.0));
  col = pow(col, vec3(1.3, 1.20, 1.0));
  col = sat(col * 1.01);
  col = pow(col, vec3(0.7 / 2.2));
  fragColor = vec4(col, 1.0);
}
`

type ProgramInfo = {
  program: WebGLProgram
  uniforms: {
    iTime: WebGLUniformLocation | null
    iResolution: WebGLUniformLocation | null
    iMouse: WebGLUniformLocation | null
    iChannel0: WebGLUniformLocation | null
    iChannel1: WebGLUniformLocation | null
    iChannel2: WebGLUniformLocation | null
    iChannel3: WebGLUniformLocation | null
  }
}

type RenderTarget = {
  framebuffer: WebGLFramebuffer
  texture: WebGLTexture
  width: number
  height: number
}

type RenderTargets = {
  aRead: RenderTarget
  aWrite: RenderTarget
  b: RenderTarget
  c: RenderTarget
  d: RenderTarget
}

type MouseState = {
  x: number
  y: number
  clickX: number
  clickY: number
  down: boolean
}

// Estructura de datos estática para configurar los planetas e interactividad
const PLANETS_DATA = [
  {
    id: 1,
    name: 'Kepler-452b',
    top: '22%',
    left: '18%',
    title: 'Quién suelo ser',
    data: 'Suelo ser una persona bastante espontánea pero a la vez perfeccionista, aunque puede sonar contradictorio pero pienso que es una buena combinación, ya que busco la manera más eficiente y rápida para hacer las cosas y a la vez hacerlo casi perfecto, ya que no creo en la perfección pero sí en lo casi perfecto…',
  },
  {
    id: 2,
    name: 'Gliese 581g',
    top: '28%',
    left: '78%',
    title: '¿Por qué me gusta la matemática?',
    data: 'No creo en la perfección, pero sí en lo casi perfecto y creo que lo más cercano a la perfección son las matemáticas, una de las cosas que me apasionan, varios caminos para llegar a una respuesta 99.99999% perfecta, pienso que las matemáticas no fueron inventadas sino descubiertas, el lenguaje en el que funciona lo poco del universo que conocemos y lo que nos ha llevado tan lejos como especie ha sido la matemática. A pesar de que se pueden encontrar soluciones 99.99999% acertadas, ese 0.000001% puede llegar a ser enorme si es que se piensa lo suficientemente grande como en términos del Universo, otra cosa que me apasiona y por lo que planeo hacer algo próximamente también',
  },
  {
    id: 3,
    name: 'Proxima b',
    top: '68%',
    left: '24%',
    title: '¿Por qué me apasiona el universo?',
    data: 'Me apasiona el universo porque sigue a las leyes de la física, hechas con matemáticas, creo que está muy ligado a los números aunque no sepamos mucho del Universo, creo que lo más cercano a un “Dios” es el universo y su naturaleza, siendo la naturaleza en sí y también a la naturaleza como los animales e insectos, todo lo intrínseco del universo se me hace lo más cercano a un “Dios”.',
  },
  {
    id: 4,
    name: 'HD189733',
    top: '72%',
    left: '72%',
    title: 'Otra cosa que me apasiona',
    data: 'La naturaleza me apasiona, de hecho cuando era pequeño quería ser biólogo marino o biólogo terrestre, ya que siempre me han gustado las diferentes formas de “vida” que hay en el universo, o más bien en este planeta, pero también como algo tan diminuto como una hormiga comparte el hecho de estar vivo con una cosa tan inmensa como una ballena azul… es interesante y raro',
  },
  {
    id: 5,
    name: 'WASP-76b',
    top: '50%',
    left: '50%',
    title: 'Próximamente',
    data: 'Próximamente planeo seguir la especialidad Aeroespacial en la Universidad de Leipzig que fue agregada recientemente en la UVG, pero además de eso quiero sacar licenciatura en Matemática pura más adelante en Inglaterra',
  },
  {
    id: 6,
    name: 'K2-18b',
    top: '12%',
    left: '50%',
    title: 'PD',
    data: 'PD: El fondo de líneas y el blackhole no son imágenes ni GIFs, se dibujan en tiempo real con shaders, o sea pequeños programas que corren en la GPU y calculan el color de cada píxel. El fondo de líneas funciona como una especie de campo ondulatorio matemático. Para cada píxel se calcula su posición en pantalla, luego se mezclan varias ondas sin() con distintas velocidades, escalas y desplazamientos. Esas ondas generan bandas suaves que se mueven con el tiempo. El blackhole es más complejo. Usa raymarching, para cada píxel se lanza un rayo imaginario desde una cámara virtual hacia una escena 3D matemática. Ese rayo avanza paso a paso por el espacio. En cada paso, el shader calcula cómo el agujero negro dobla la dirección del rayo hacia el centro, imitando una lente gravitacional. No es una simulación física EXACTA de relatividad general, peeeeero sí usa una idea parecida mientras más cerca pasa el rayo del centro, más fuerte se curva. En resumen TODO es matemática por píxel, ondas senoidales para el fondo, rayos curvados para el blackhole, distancias y ruido para el disco, y desenfoques acumulados para el brillo cinematográfico.',
  },
]

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to create shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown shader compile error'
    gl.deleteShader(shader)
    throw new Error(info)
  }

  return shader
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string): ProgramInfo {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()

  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    throw new Error('Unable to create WebGL program')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'Unknown program link error'
    gl.deleteProgram(program)
    throw new Error(info)
  }

  return {
    program,
    uniforms: {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iChannel0: gl.getUniformLocation(program, 'iChannel0'),
      iChannel1: gl.getUniformLocation(program, 'iChannel1'),
      iChannel2: gl.getUniformLocation(program, 'iChannel2'),
      iChannel3: gl.getUniformLocation(program, 'iChannel3'),
    },
  }
}

function createProceduralNoiseTexture(gl: WebGL2RenderingContext) {
  const size = 256
  const data = new Uint8Array(size * size * 4)

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.floor(Math.random() * 256)
  }

  const texture = gl.createTexture()
  if (!texture) throw new Error('Unable to create procedural noise texture')

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}

function createRenderTarget(gl: WebGL2RenderingContext, width: number, height: number): RenderTarget {
  const texture = gl.createTexture()
  const framebuffer = gl.createFramebuffer()

  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture)
    if (framebuffer) gl.deleteFramebuffer(framebuffer)
    throw new Error('Unable to create framebuffer resources')
  }

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindTexture(gl.TEXTURE_2D, null)

  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteTexture(texture)
    gl.deleteFramebuffer(framebuffer)
    throw new Error(`Framebuffer incomplete: ${status}`)
  }

  return { framebuffer, texture, width, height }
}

function deleteRenderTarget(gl: WebGL2RenderingContext, target: RenderTarget) {
  gl.deleteFramebuffer(target.framebuffer)
  gl.deleteTexture(target.texture)
}

function createRenderTargets(gl: WebGL2RenderingContext, width: number, height: number): RenderTargets {
  return {
    aRead: createRenderTarget(gl, width, height),
    aWrite: createRenderTarget(gl, width, height),
    b: createRenderTarget(gl, width, height),
    c: createRenderTarget(gl, width, height),
    d: createRenderTarget(gl, width, height),
  }
}

function deleteRenderTargets(gl: WebGL2RenderingContext, targets: RenderTargets | null) {
  if (!targets) return
  deleteRenderTarget(gl, targets.aRead)
  deleteRenderTarget(gl, targets.aWrite)
  deleteRenderTarget(gl, targets.b)
  deleteRenderTarget(gl, targets.c)
  deleteRenderTarget(gl, targets.d)
}

function setCommonUniforms(
  gl: WebGL2RenderingContext,
  info: ProgramInfo,
  time: number,
  width: number,
  height: number,
  mouse: MouseState,
) {
  gl.uniform1f(info.uniforms.iTime, time)
  gl.uniform3f(info.uniforms.iResolution, width, height, 1.0)
  gl.uniform4f(
    info.uniforms.iMouse,
    mouse.x,
    mouse.y,
    mouse.down ? mouse.clickX : -Math.abs(mouse.clickX),
    mouse.down ? mouse.clickY : -Math.abs(mouse.clickY),
  )
}

function bindTextureToUnit(
  gl: WebGL2RenderingContext,
  info: ProgramInfo,
  uniformName: keyof ProgramInfo['uniforms'],
  unit: number,
  texture: WebGLTexture,
) {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(info.uniforms[uniformName], unit)
}

export default function BlackHoleScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollFrameRef = useRef<HTMLDivElement>(null)
  const scrollDismissedRef = useRef(false)
  const scrollSuppressedUntilRef = useRef(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScrollImmersive, setIsScrollImmersive] = useState(false)
  
  // Estado que almacena el id del planeta seleccionado (null si no hay ninguno abierto)
  const [activePlanetId, setActivePlanetId] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return undefined

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })

    if (!gl) {
      console.error('WebGL2 is not supported in this browser.')
      return undefined
    }

    if (!gl.getExtension('EXT_color_buffer_float')) {
      console.error('EXT_color_buffer_float is required for RGBA16F framebuffer rendering.')
      return undefined
    }

    let animationFrame = 0
    let disposed = false
    let targets: RenderTargets | null = null
    let width = 1
    let height = 1
    let dpr = 1
    const mouse: MouseState = { x: 0, y: 0, clickX: 0, clickY: 0, down: false }

    const programs = [
      createProgram(gl, BUFFER_A_SHADER),
      createProgram(gl, BUFFER_B_SHADER),
      createProgram(gl, BUFFER_C_SHADER),
      createProgram(gl, BUFFER_D_SHADER),
      createProgram(gl, IMAGE_SHADER),
    ] as const

    const [programA, programB, programC, programD, programImage] = programs
    const noiseTexture0 = createProceduralNoiseTexture(gl)
    const noiseTexture1 = createProceduralNoiseTexture(gl)
    const vao = gl.createVertexArray()
    const vertexBuffer = gl.createBuffer()

    if (!vao || !vertexBuffer) {
      programs.forEach((info) => gl.deleteProgram(info.program))
      gl.deleteTexture(noiseTexture0)
      gl.deleteTexture(noiseTexture1)
      if (vao) gl.deleteVertexArray(vao)
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer)
      throw new Error('Unable to create fullscreen quad resources')
    }

    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    const resize = () => {
      const rect = container.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.max(1, Math.floor(rect.width * dpr))
      const nextHeight = Math.max(1, Math.floor(rect.height * dpr))

      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      if (nextWidth === width && nextHeight === height && targets) return

      width = nextWidth
      height = nextHeight
      canvas.width = width
      canvas.height = height

      deleteRenderTargets(gl, targets)
      targets = createRenderTargets(gl, width, height)
      gl.viewport(0, 0, width, height)
    }

    const updateMouseFromEvent = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (event.clientX - rect.left) * dpr
      mouse.y = (rect.height - (event.clientY - rect.top)) * dpr
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateMouseFromEvent(event)
    }

    const handlePointerDown = (event: PointerEvent) => {
      updateMouseFromEvent(event)
      mouse.clickX = mouse.x
      mouse.clickY = mouse.y
      mouse.down = true
    }

    const handlePointerUp = () => {
      mouse.down = false
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === container)
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const startedAt = performance.now()

    const drawFullscreen = () => {
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const render = () => {
      if (disposed || !targets) return

      animationFrame = window.requestAnimationFrame(render)
      const time = (performance.now() - startedAt) * 0.001

      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)
      gl.bindVertexArray(vao)

      gl.useProgram(programA.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets.aWrite.framebuffer)
      gl.viewport(0, 0, width, height)
      setCommonUniforms(gl, programA, time, width, height, mouse)
      bindTextureToUnit(gl, programA, 'iChannel0', 0, noiseTexture0)
      bindTextureToUnit(gl, programA, 'iChannel1', 1, noiseTexture1)
      bindTextureToUnit(gl, programA, 'iChannel2', 2, targets.aRead.texture)
      drawFullscreen()

      ;[targets.aRead, targets.aWrite] = [targets.aWrite, targets.aRead]

      gl.useProgram(programB.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets.b.framebuffer)
      gl.viewport(0, 0, width, height)
      setCommonUniforms(gl, programB, time, width, height, mouse)
      bindTextureToUnit(gl, programB, 'iChannel0', 0, targets.aRead.texture)
      drawFullscreen()

      gl.useProgram(programC.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets.c.framebuffer)
      gl.viewport(0, 0, width, height)
      setCommonUniforms(gl, programC, time, width, height, mouse)
      bindTextureToUnit(gl, programC, 'iChannel0', 0, targets.b.texture)
      drawFullscreen()

      gl.useProgram(programD.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets.d.framebuffer)
      gl.viewport(0, 0, width, height)
      setCommonUniforms(gl, programD, time, width, height, mouse)
      bindTextureToUnit(gl, programD, 'iChannel0', 0, targets.c.texture)
      drawFullscreen()

      gl.useProgram(programImage.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, width, height)
      setCommonUniforms(gl, programImage, time, width, height, mouse)
      bindTextureToUnit(gl, programImage, 'iChannel0', 0, targets.aRead.texture)
      bindTextureToUnit(gl, programImage, 'iChannel3', 3, targets.d.texture)
      drawFullscreen()

      gl.bindVertexArray(null)
    }

    render()

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindVertexArray(null)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)

      deleteRenderTargets(gl, targets)
      programs.forEach((info) => gl.deleteProgram(info.program))
      gl.deleteTexture(noiseTexture0)
      gl.deleteTexture(noiseTexture1)
      gl.deleteBuffer(vertexBuffer)
      gl.deleteVertexArray(vao)
    }
  }, [])

  useEffect(() => {
    let frame = 0

    const updateScrollImmersion = () => {
      frame = 0
      const el = scrollFrameRef.current
      if (!el || document.fullscreenElement) return

      if (performance.now() < scrollSuppressedUntilRef.current) {
        setIsScrollImmersive(false)
        return
      }

      const rect = el.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const activationLine = viewportHeight * 0.22
      const shouldImmerse = rect.top <= activationLine && rect.bottom >= activationLine

      if (!shouldImmerse) {
        scrollDismissedRef.current = false
        setIsScrollImmersive(false)
        return
      }

      if (!scrollDismissedRef.current) {
        setIsScrollImmersive(true)
      }
    }

    const scheduleUpdate = () => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(updateScrollImmersion)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  useEffect(() => {
    const suppressScrollImmersion = (event: Event) => {
      const duration =
        event instanceof CustomEvent && typeof event.detail?.duration === 'number'
          ? event.detail.duration
          : 1600

      scrollSuppressedUntilRef.current = performance.now() + duration
      scrollDismissedRef.current = true
      setIsScrollImmersive(false)
    }

    window.addEventListener('blackhole:suppress-scroll-immersion', suppressScrollImmersion)

    return () => {
      window.removeEventListener('blackhole:suppress-scroll-immersion', suppressScrollImmersion)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('blackhole-immersive', isScrollImmersive)
    document.body.classList.toggle('blackhole-immersive', isScrollImmersive)

    return () => {
      document.documentElement.classList.remove('blackhole-immersive')
      document.body.classList.remove('blackhole-immersive')
    }
  }, [isScrollImmersive])

  const enterBrowserFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      }
    } catch (err) {
      console.error('Error al intentar activar la pantalla completa:', err)
    }
  }

  const minimizeBlackHole = async () => {
    scrollDismissedRef.current = true
    setIsScrollImmersive(false)

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error al intentar salir de la pantalla completa:', err)
    }
  }

  const selectedPlanet = PLANETS_DATA.find((p) => p.id === activePlanetId)
  const isImmersive = isFullscreen || isScrollImmersive
  const controlButtonClass =
    'flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 font-sans text-xs font-medium uppercase tracking-widest text-neutral-300 backdrop-blur-md transition-all hover:bg-neutral-900/80 hover:text-white active:scale-95 select-none focus:outline-none'

  return (
    <div 
      ref={scrollFrameRef}
      className={`relative transition-[height] duration-300 ${
        isScrollImmersive ? 'h-[160vh]' : 'h-[640px]'
      }`}
    >
      <div
        ref={containerRef} 
        className={`${
          isScrollImmersive && !isFullscreen
            ? 'fixed left-0 top-0 z-[220] h-[100dvh] w-[100dvw] max-w-none rounded-none border-0'
            : 'relative h-full w-full'
        } bg-[#0D0D0D] overflow-hidden transition-all duration-300 ${
          isImmersive ? 'rounded-none border-0' : 'rounded-2xl border border-neutral-900'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-grab active:cursor-grabbing"
          aria-label="Procedural WebGL2 black hole animation"
        />

      {/* --- PLANETAS INTERACTIVOS (HTML Overlay) --- */}
        {PLANETS_DATA.map((planet) => (
        <button
          key={planet.id}
          onClick={() => setActivePlanetId(planet.id)}
          style={{ top: planet.top, left: planet.left }}
          className="absolute z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 group focus:outline-none transition-transform active:scale-95"
        >
          {/* Nodo Matte de UI */}
          <div className="relative flex h-5 w-5 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm transition-all duration-200 group-hover:border-neutral-500 group-hover:bg-neutral-900">
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-500 transition-all duration-200 group-hover:bg-white" />
          </div>
          {/* Etiqueta Minimalista */}
          <span className="font-sans text-[10px] font-semibold tracking-widest text-neutral-400 uppercase select-none transition-all duration-200 group-hover:text-white">
            {planet.name}
          </span>
        </button>
        ))}

      {/* --- POP-UP MODAL (Matte Glassmorphism Estilo Startup) --- */}
        {activePlanetId !== null && selectedPlanet && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-200">
          {/* Clic fuera del contenedor para cerrar */}
          <div className="absolute inset-0" onClick={() => setActivePlanetId(null)} />
          
          {/* Contenedor del Pop-up con 16px de rounded corners */}
          <div className="relative w-11/12 max-w-md rounded-2xl border border-neutral-800/80 bg-neutral-950/90 p-6 shadow-2xl backdrop-blur-xl select-text transition-all transform scale-100 opacity-100">
            
            {/* Header del Pop-up */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3.5">
              <h3 className="font-sans text-xs font-semibold tracking-widest text-white uppercase">
                {selectedPlanet.title}
              </h3>
              <button
                onClick={() => setActivePlanetId(null)}
                className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-900 hover:text-white transition-all focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Caja de contenido / Relleno personalizable */}
            <div className="mt-4 min-h-[140px] rounded-xl border border-neutral-900 bg-neutral-900/30 p-4 font-sans text-xs leading-relaxed text-neutral-400">
              <p>{selectedPlanet.data}</p>
            </div>
          </div>
        </div>
        )}

      {/* Botón de control Fullscreen */}
        <div className="absolute bottom-6 right-6 z-40 flex items-center gap-2">
          {isScrollImmersive && !isFullscreen ? (
            <>
              <button onClick={enterBrowserFullscreen} className={controlButtonClass}>
                <Maximize2 size={15} strokeWidth={2} />
                Maximizar
              </button>
              <button onClick={minimizeBlackHole} className={controlButtonClass}>
                <Minimize2 size={15} strokeWidth={2} />
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={isFullscreen ? minimizeBlackHole : enterBrowserFullscreen}
              className={controlButtonClass}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={15} strokeWidth={2} />
                  Salir
                </>
              ) : (
                <>
                  <Maximize2 size={15} strokeWidth={2} />
                  Explorar Universo
                </>
              )}
            </button>
          )}
        </div>

      {/* Overlay de instrucciones dinámico */}
        <div 
          className={`absolute left-1/2 top-8 z-30 -translate-x-1/2 pointer-events-none select-none transition-all duration-500 transform ${
            isImmersive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
          }`}
        >
          <div className="rounded-xl border border-neutral-800/40 bg-neutral-950/40 px-6 py-3 backdrop-blur-md">
            <p className="font-sans text-xs font-light tracking-wide text-neutral-400 text-center">
              ✦ Selecciona un planeta en órbita para desplegar registros...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
