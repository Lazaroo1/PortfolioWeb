import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // En lienzos más angostos que 16:10 (teléfono) la cámara se aleja para dar el mismo encuadre
  // horizontal que en desktop; en 16:10 o más ancho zoom = 1.0 y la imagen queda idéntica
  float zoom = max(1.0, 1.59 / aspect);
  vec3 eyevec = normalize(vec3((uveye * 2.0 - 1.0) * vec2(aspect, 1.0) * zoom, 6.0));
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

// Acumulación temporal a resolución completa, para cuando el raymarching va a menor resolución.
// La pasada A recibe un historial negro, así que entrega su muestra cruda × 0.12; cada rayo cayó en
// un punto pseudoaleatorio de su texel (el mismo rand2 de la pasada A), y aquí se suma al píxel de
// pantalla donde cayó. Con unos frames queda una imagen de resolución completa
const ACCUM_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform float iTime;
uniform vec3 iResolution;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
// Peso de cada muestra nueva, y peso del frame actual suavizado (sube al mover la cámara)
uniform float uResponse;
uniform float uRefresh;

out vec4 fragColor;

float saturateF(float x) { return clamp(x, 0.0, 1.0); }

float rand2(vec2 c) {
  return saturateF(fract(sin(dot(c, vec2(12.9898, 78.223))) * 43758.5453));
}

void main() {
  vec2 res = iResolution.xy;
  vec2 lowRes = vec2(textureSize(iChannel0, 0));
  vec2 pixel = gl_FragCoord.xy;
  ivec2 base = ivec2(floor(pixel / res * lowRes - 0.5));
  float wave = sin(iTime);

  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      ivec2 texel = base + ivec2(x, y);
      if (any(lessThan(texel, ivec2(0))) || any(greaterThanEqual(texel, ivec2(lowRes)))) continue;
      vec2 center = (vec2(texel) + 0.5) / lowRes;
      vec2 jitter = vec2(rand2(center + wave), rand2(center + 1.0 + wave));
      vec2 hit = (center + jitter / lowRes) * res - pixel;
      float w = exp(-dot(hit, hit) * 1.2);
      sum += texelFetch(iChannel0, texel, 0).rgb * w;
      weight += w;
    }
  }

  vec2 uv = pixel / res;
  vec3 history = texture(iChannel1, uv).rgb;
  vec3 current = sum / max(weight, 1e-4) / 0.12;
  vec3 col = mix(history, current, saturateF(weight) * uResponse);
  // Un poco del frame actual suavizado para que ningún píxel se quede congelado
  col = mix(col, texture(iChannel0, uv).rgb / 0.12, uRefresh);
  fragColor = vec4(saturateF(col.r), saturateF(col.g), saturateF(col.b), 1.0);
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
    uResponse: WebGLUniformLocation | null
    uRefresh: WebGLUniformLocation | null
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
  // Historial a resolución completa; solo existe cuando el raymarching va a menor resolución
  hRead: RenderTarget | null
  hWrite: RenderTarget | null
}

type MouseState = {
  x: number
  y: number
  clickX: number
  clickY: number
  down: boolean
}

type PendingProgram = {
  program: WebGLProgram
  fragmentShader: WebGLShader
}

type SceneResources = {
  vertexShader: WebGLShader
  pending: PendingProgram[]
  noiseTexture0: WebGLTexture
  noiseTexture1: WebGLTexture
  blackTexture: WebGLTexture
  vao: WebGLVertexArrayObject
  vertexBuffer: WebGLBuffer
}

// Salta frames a menos de 9.5 ms del anterior: en pantallas de 120 Hz queda en 60 fps y a 60 Hz no cambia nada
const MIN_FRAME_INTERVAL_MS = 9.5
// Si el GPU no da abasto, primero baja a la mitad de fps y solo después la resolución del raymarching,
// que nunca baja de 0.75 rayos por píxel CSS (y se reconstruye con B-spline, sin bloques)
const MIN_RAYMARCH_PIXEL_RATIO = 0.75
// Frames usados para medir la frecuencia real de la pantalla (60, 120, o 30 en modo ahorro)
const REFRESH_SAMPLES = 10
// A media tasa y estable, vuelve a probar fps completos tras 8 s; si falla, espera el doble (hasta 64 s)
const PROBE_HOLD_MIN_MS = 8000
const PROBE_HOLD_MAX_MS = 64000

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

  // El estado se revisa hasta después de enlazar: así, con KHR_parallel_shader_compile,
  // el driver compila en segundo plano sin congelar la página
  return shader
}

function startProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentSource: string,
): PendingProgram {
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!program) throw new Error('Unable to create WebGL program')

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  return { program, fragmentShader }
}

function finishProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  { program, fragmentShader }: PendingProgram,
): ProgramInfo {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info =
      gl.getShaderInfoLog(fragmentShader) ||
      gl.getShaderInfoLog(vertexShader) ||
      gl.getProgramInfoLog(program) ||
      'Unknown program link error'
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
      uResponse: gl.getUniformLocation(program, 'uResponse'),
      uRefresh: gl.getUniformLocation(program, 'uRefresh'),
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

// A (el raymarching) puede ir a menor resolución que el resto. En ese caso se acumula en un
// historial a resolución completa (ACCUM_SHADER), y el bloom y la imagen final leen ese historial
function createRenderTargets(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  raymarchWidth: number,
  raymarchHeight: number,
): RenderTargets {
  const accumulate = raymarchWidth < width || raymarchHeight < height
  return {
    aRead: createRenderTarget(gl, raymarchWidth, raymarchHeight),
    aWrite: createRenderTarget(gl, raymarchWidth, raymarchHeight),
    b: createRenderTarget(gl, width, height),
    c: createRenderTarget(gl, width, height),
    d: createRenderTarget(gl, width, height),
    hRead: accumulate ? createRenderTarget(gl, width, height) : null,
    hWrite: accumulate ? createRenderTarget(gl, width, height) : null,
  }
}

// La imagen ya acumulada: el historial completo si existe, si no la pasada A
function accumulated(targets: RenderTargets) {
  return targets.hRead ?? targets.aRead
}

// Pasa la imagen acumulada al target nuevo para que un cambio de tamaño no parpadee en negro
function copyHistory(gl: WebGL2RenderingContext, from: RenderTarget, to: RenderTarget) {
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, from.framebuffer)
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, to.framebuffer)
  gl.blitFramebuffer(
    0, 0, from.width, from.height,
    0, 0, to.width, to.height,
    gl.COLOR_BUFFER_BIT,
    gl.LINEAR,
  )
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
}

function createSceneResources(gl: WebGL2RenderingContext): SceneResources {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const pending = [
    BUFFER_A_SHADER,
    BUFFER_B_SHADER,
    BUFFER_C_SHADER,
    BUFFER_D_SHADER,
    IMAGE_SHADER,
    ACCUM_SHADER,
  ].map((source) => startProgram(gl, vertexShader, source))
  const noiseTexture0 = createProceduralNoiseTexture(gl)
  const noiseTexture1 = createProceduralNoiseTexture(gl)

  // Historial negro para la pasada A cuando se acumula aparte: así entrega su muestra cruda
  const blackTexture = gl.createTexture()
  if (!blackTexture) throw new Error('Unable to create black texture')
  gl.bindTexture(gl.TEXTURE_2D, blackTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
  gl.bindTexture(gl.TEXTURE_2D, null)
  const vao = gl.createVertexArray()
  const vertexBuffer = gl.createBuffer()
  if (!vao || !vertexBuffer) throw new Error('Unable to create fullscreen quad resources')

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

  return { vertexShader, pending, noiseTexture0, noiseTexture1, blackTexture, vao, vertexBuffer }
}

function deleteSceneResources(gl: WebGL2RenderingContext, resources: SceneResources) {
  resources.pending.forEach(({ program, fragmentShader }) => {
    gl.deleteProgram(program)
    gl.deleteShader(fragmentShader)
  })
  gl.deleteShader(resources.vertexShader)
  gl.deleteTexture(resources.noiseTexture0)
  gl.deleteTexture(resources.noiseTexture1)
  gl.deleteTexture(resources.blackTexture)
  gl.deleteBuffer(resources.vertexBuffer)
  gl.deleteVertexArray(resources.vao)
}

function deleteRenderTargets(gl: WebGL2RenderingContext, targets: RenderTargets | null) {
  if (!targets) return
  deleteRenderTarget(gl, targets.aRead)
  deleteRenderTarget(gl, targets.aWrite)
  deleteRenderTarget(gl, targets.b)
  deleteRenderTarget(gl, targets.c)
  deleteRenderTarget(gl, targets.d)
  if (targets.hRead) deleteRenderTarget(gl, targets.hRead)
  if (targets.hWrite) deleteRenderTarget(gl, targets.hWrite)
}

function setCommonUniforms(
  gl: WebGL2RenderingContext,
  info: ProgramInfo,
  time: number,
  width: number,
  height: number,
  mouse: MouseState,
  mouseScale = 1,
) {
  gl.uniform1f(info.uniforms.iTime, time)
  gl.uniform3f(info.uniforms.iResolution, width, height, 1.0)
  gl.uniform4f(
    info.uniforms.iMouse,
    mouse.x * mouseScale,
    mouse.y * mouseScale,
    (mouse.down ? mouse.clickX : -Math.abs(mouse.clickX)) * mouseScale,
    (mouse.down ? mouse.clickY : -Math.abs(mouse.clickY)) * mouseScale,
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Pantalla completa dentro de la página: Safari en iPhone no deja poner un div en fullscreen
  const [isPageFullscreen, setIsPageFullscreen] = useState(false)
  // Cambia cuando el navegador restaura un contexto WebGL perdido, para reconstruir la escena
  const [glGeneration, setGlGeneration] = useState(0)

  // Estado que almacena el id del planeta seleccionado (null si no hay ninguno abierto)
  const [activePlanetId, setActivePlanetId] = useState<number | null>(null)

  const isExpanded = isFullscreen || isPageFullscreen

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

    let resources: SceneResources
    try {
      resources = createSceneResources(gl)
    } catch (error) {
      console.error('Unable to initialize the black hole scene:', error)
      return undefined
    }

    const { vertexShader, pending, noiseTexture0, noiseTexture1, blackTexture, vao } = resources
    const parallelCompile = gl.getExtension('KHR_parallel_shader_compile')

    let frame = 0
    let disposed = false
    let failed = false
    let contextLost = false
    let onScreen = false
    let running = false
    let programs: ProgramInfo[] | null = null
    let targets: RenderTargets | null = null
    let width = 1
    let height = 1
    let dpr = 1
    const mouse: MouseState = { x: 0, y: 0, clickX: 0, clickY: 0, down: false }

    // Reloj de la animación: no avanza mientras está pausada, así al volver sigue donde iba
    const startedAt = performance.now()
    let pausedAt: number | null = startedAt
    let pausedFor = 0

    // Calidad adaptativa: si el GPU no llega a la tasa objetivo, primero baja a la mitad de fps
    // (la imagen no pierde nitidez) y solo si aún no alcanza baja la resolución de la pasada A
    let displayFps = 60
    let halfRate = false
    let targetFps = 60
    let pixelBudget = Infinity
    let raymarchScale = 1
    let lastDrawAt = 0
    let lastTickAt = 0
    let windowStart = 0
    let windowFrames = 0
    let slowWindows = 0
    let skipWindows = 0
    // Si bajar la resolución no sube los fps, el cuello de botella es otro: se regresa y no se insiste
    let stepCheck: { fps: number; budget: number } | null = null
    let adaptationLocked = false
    // Un tirón pasajero no debe dejarla a media tasa para siempre: cada tanto prueba fps completos
    let probing = false
    let probeAt = 0
    let probeHold = PROBE_HOLD_MIN_MS
    const refreshIntervals: number[] = []
    // Al mover la cámara la acumulación se vuelve casi inmediata unos frames, para no dejar rastro
    let lastMouseX = 0
    let lastMouseY = 0
    let cameraMoveFrames = 0

    const minRaymarchScale = () => Math.min(1, MIN_RAYMARCH_PIXEL_RATIO / dpr)
    const scaleForBudget = (budget: number) =>
      Math.max(minRaymarchScale(), Math.min(1, Math.sqrt(budget / (width * height))))

    const allocateTargets = () => {
      raymarchScale = scaleForBudget(pixelBudget)
      const previous = targets
      targets = createRenderTargets(
        gl,
        width,
        height,
        Math.max(1, Math.round(width * raymarchScale)),
        Math.max(1, Math.round(height * raymarchScale)),
      )

      if (previous) {
        // Se siembra la imagen ya acumulada en donde se va a acumular ahora
        copyHistory(gl, accumulated(previous), targets.hRead ?? targets.aRead)
        deleteRenderTargets(gl, previous)
      }

      // La primera medición después de reasignar no cuenta
      windowStart = 0
      slowWindows = 0
      skipWindows = 1
    }

    const drawFullscreen = () => {
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const drawFrame = (now: number) => {
      if (!programs || !targets) return

      const [programA, programB, programC, programD, programImage, programAccum] = programs
      const time = ((pausedAt ?? now) - startedAt - pausedFor) * 0.001
      const raymarch = targets.aWrite
      const history = targets.hRead
      const nextHistory = targets.hWrite

      if (mouse.x !== lastMouseX || mouse.y !== lastMouseY) cameraMoveFrames = 6
      lastMouseX = mouse.x
      lastMouseY = mouse.y

      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)
      gl.bindVertexArray(vao)

      gl.useProgram(programA.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, raymarch.framebuffer)
      gl.viewport(0, 0, raymarch.width, raymarch.height)
      setCommonUniforms(gl, programA, time, raymarch.width, raymarch.height, mouse, raymarch.width / width)
      bindTextureToUnit(gl, programA, 'iChannel0', 0, noiseTexture0)
      bindTextureToUnit(gl, programA, 'iChannel1', 1, noiseTexture1)
      // Si se acumula aparte, la pasada A recibe historial negro y entrega su muestra cruda
      bindTextureToUnit(gl, programA, 'iChannel2', 2, history ? blackTexture : targets.aRead.texture)
      drawFullscreen()

      if (history && nextHistory) {
        // Pasos parecidos a la mezcla original (0.88 por frame) aunque llegue ~1 muestra cada pocos frames
        const sampleShare = (raymarch.width * raymarch.height) / (width * height)
        const response = Math.min(0.9, Math.max(0.08, 0.05 / (2.6 * sampleShare)))
        const moving = cameraMoveFrames > 0

        gl.useProgram(programAccum.program)
        gl.bindFramebuffer(gl.FRAMEBUFFER, nextHistory.framebuffer)
        gl.viewport(0, 0, width, height)
        setCommonUniforms(gl, programAccum, time, width, height, mouse)
        gl.uniform1f(programAccum.uniforms.uResponse, moving ? 0.9 : response)
        gl.uniform1f(programAccum.uniforms.uRefresh, moving ? 0.5 : 0.02)
        bindTextureToUnit(gl, programAccum, 'iChannel0', 0, raymarch.texture)
        bindTextureToUnit(gl, programAccum, 'iChannel1', 1, history.texture)
        drawFullscreen()

        targets.hRead = nextHistory
        targets.hWrite = history
      } else {
        ;[targets.aRead, targets.aWrite] = [targets.aWrite, targets.aRead]
      }
      if (cameraMoveFrames > 0) cameraMoveFrames -= 1

      const image = accumulated(targets).texture

      gl.useProgram(programB.program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets.b.framebuffer)
      gl.viewport(0, 0, width, height)
      setCommonUniforms(gl, programB, time, width, height, mouse)
      bindTextureToUnit(gl, programB, 'iChannel0', 0, image)
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
      bindTextureToUnit(gl, programImage, 'iChannel0', 0, image)
      bindTextureToUnit(gl, programImage, 'iChannel3', 3, targets.d.texture)
      drawFullscreen()

      gl.bindVertexArray(null)
    }

    const adaptQuality = (now: number) => {
      if (!targets) return

      // Ventanas de medio segundo. Volver de una pausa (fuera de pantalla, pestaña oculta) reinicia la
      // medición en updateRunning; cualquier otro frame lento sí cuenta, por lento que sea
      if (windowStart === 0) {
        windowStart = now
        windowFrames = 0
        return
      }

      windowFrames += 1
      const elapsed = now - windowStart
      if (elapsed < 500) return

      const fps = (windowFrames * 1000) / elapsed
      windowStart = now
      windowFrames = 0

      if (skipWindows > 0) {
        skipWindows -= 1
        return
      }

      if (stepCheck) {
        const { fps: fpsBefore, budget } = stepCheck
        stepCheck = null

        if (fps < fpsBefore * 1.1) {
          pixelBudget = budget
          adaptationLocked = true
          allocateTargets()
          return
        }
      }

      if (fps >= targetFps * 0.85) {
        slowWindows = 0
        if (probing) {
          // Los fps completos se sostuvieron
          probing = false
          probeHold = PROBE_HOLD_MIN_MS
        } else if (halfRate && now >= probeAt) {
          halfRate = false
          targetFps = displayFps
          probing = true
          skipWindows = 1
        }
        return
      }

      slowWindows += 1

      // La prueba de fps completos no aguantó: de vuelta a media tasa y la próxima espera el doble
      if (probing) {
        probing = false
        halfRate = true
        targetFps = displayFps / 2
        probeHold = Math.min(probeHold * 2, PROBE_HOLD_MAX_MS)
        probeAt = now + probeHold
        slowWindows = 0
        skipWindows = 1
        return
      }

      if (slowWindows < 2) return

      // Primero, mitad de fps; en modo ahorro (pantalla a 30 Hz) no, quedaría en 15
      if (!halfRate && displayFps >= 50) {
        halfRate = true
        targetFps = displayFps / 2
        probeAt = now + probeHold
        slowWindows = 0
        skipWindows = 1
        // Si ni a media tasa alcanza, en el mismo paso baja también la resolución (no perder 2 s)
        if (fps >= targetFps * 0.85) return
      }

      if (adaptationLocked) return

      // Después, baja la pasada A al número de píxeles que este GPU aguanta a la tasa objetivo
      const nextBudget = targets.aRead.width * targets.aRead.height * (fps / targetFps) * 0.9
      // Ya está en el piso (o casi): reasignar no cambiaría nada
      if (scaleForBudget(nextBudget) > raymarchScale * 0.95) return

      stepCheck = { fps, budget: pixelBudget }
      pixelBudget = nextBudget
      allocateTargets()
    }

    const finishCompiling = () => {
      try {
        programs = pending.map((info) => finishProgram(gl, vertexShader, info))
      } catch (error) {
        console.error('Black hole shaders failed to compile:', error)
        return false
      }

      // Tasa objetivo = frecuencia real de la pantalla, con tope de 60
      const sorted = [...refreshIntervals].sort((a, b) => a - b)
      displayFps = Math.min(60, 1000 / sorted[Math.floor(sorted.length / 2)])
      targetFps = halfRate ? displayFps / 2 : displayFps
      return true
    }

    const schedule = () => {
      if (frame === 0 && !disposed && !contextLost) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    const tick = (now: number) => {
      frame = 0
      if (disposed || contextLost || failed) return

      if (!programs) {
        // Mientras compila, mide la frecuencia real de la pantalla (60, 120, o 30 en modo ahorro)
        if (lastTickAt > 0) refreshIntervals.push(now - lastTickAt)
        lastTickAt = now

        const compiled =
          !parallelCompile ||
          pending.every(({ program }) =>
            gl.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR),
          )

        if (!compiled || refreshIntervals.length < REFRESH_SAMPLES) {
          schedule()
          return
        }

        if (!finishCompiling()) {
          failed = true
          return
        }
      }

      if (!running) return
      schedule()
      // A media tasa salta frames enteros de la pantalla (cada 2.º a 60 Hz, cada 4.º a 120 Hz), con ritmo parejo
      const minGap = halfRate ? (1000 / targetFps) * 0.8 : MIN_FRAME_INTERVAL_MS
      if (now - lastDrawAt < minGap) return

      adaptQuality(now)
      lastDrawAt = now
      drawFrame(now)
    }

    // Solo dibuja cuando se ve: fuera de pantalla o con la pestaña oculta queda en pausa
    const updateRunning = () => {
      const shouldRun = onScreen && !document.hidden
      if (shouldRun === running) return
      running = shouldRun
      const now = performance.now()

      if (running) {
        if (pausedAt !== null) pausedFor += now - pausedAt
        pausedAt = null
        // La pausa no cuenta como frames lentos
        windowStart = 0
        schedule()
      } else {
        pausedAt = now
      }
    }

    const resize = () => {
      // clientWidth/Height excluyen el borde de la ventana; con el rect el canvas quedaba 2 px más grande
      const cssWidth = container.clientWidth
      const cssHeight = container.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.max(1, Math.floor(cssWidth * dpr))
      const nextHeight = Math.max(1, Math.floor(cssHeight * dpr))

      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`

      // Sin contexto no se pueden crear texturas; al restaurarse la escena se reconstruye completa
      if (contextLost || gl.isContextLost()) return
      if (nextWidth === width && nextHeight === height && targets) return

      // Otro tamaño merece otra oportunidad de adaptarse; si se achicó (salir de pantalla completa)
      // vuelve a intentar a fps completos
      if (nextWidth * nextHeight < width * height) {
        halfRate = false
        targetFps = displayFps
        probing = false
      }
      width = nextWidth
      height = nextHeight
      canvas.width = width
      canvas.height = height
      adaptationLocked = false
      stepCheck = null
      allocateTargets()

      // Cambiar el tamaño del canvas lo borra: dibujar de una vez evita un frame en negro
      drawFrame(performance.now())
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

    const handleContextLost = (event: Event) => {
      // preventDefault avisa al navegador que queremos recuperar el contexto
      event.preventDefault()
      contextLost = true
      window.cancelAnimationFrame(frame)
      frame = 0
    }

    const handleContextRestored = () => {
      setGlGeneration((value) => value + 1)
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    window.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('visibilitychange', updateRunning)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const visibilityObserver = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting
      updateRunning()
    })
    visibilityObserver.observe(container)

    schedule()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('visibilitychange', updateRunning)

      // Con el contexto perdido los objetos ya no existen: no hay nada que liberar
      if (contextLost) return

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindVertexArray(null)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)

      deleteRenderTargets(gl, targets)
      deleteSceneResources(gl, resources)
    }
  }, [glGeneration])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isExpanded) return undefined

    // Mientras ocupa toda la pantalla: oculta navbar y chat, bloquea el scroll y pausa el fondo
    const root = document.documentElement
    root.classList.add('blackhole-expanded')
    return () => root.classList.remove('blackhole-expanded')
  }, [isExpanded])

  useEffect(() => {
    if (activePlanetId === null && !isPageFullscreen) return undefined

    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (activePlanetId !== null) setActivePlanetId(null)
      else setIsPageFullscreen(false)
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activePlanetId, isPageFullscreen])

  const enterFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    if (document.fullscreenEnabled && typeof container.requestFullscreen === 'function') {
      try {
        await container.requestFullscreen()
        return
      } catch (err) {
        console.error('Error al intentar activar la pantalla completa:', err)
      }
    }

    // iPhone no tiene Fullscreen API para divs: se expande dentro de la página
    setIsPageFullscreen(true)
  }

  const exitFullscreen = async () => {
    setIsPageFullscreen(false)

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error al intentar salir de la pantalla completa:', err)
    }
  }

  const selectedPlanet = PLANETS_DATA.find((p) => p.id === activePlanetId)
  const controlButtonClass =
    'flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2.5 font-sans text-xs font-medium uppercase tracking-widest text-neutral-300 backdrop-blur-md transition-all hover:bg-neutral-900/80 hover:text-white active:scale-95 select-none focus:outline-none sm:px-4'

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden bg-[#0D0D0D]',
        isPageFullscreen ? 'fixed inset-0 z-[70] touch-none overscroll-none' : 'absolute inset-0',
        !isExpanded && 'rounded-2xl border border-white/[0.06]',
      )}
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
          {/* Etiqueta Minimalista (la sombra la mantiene legible sobre el disco brillante) */}
          <span className="whitespace-nowrap font-sans text-[10px] font-semibold tracking-widest text-neutral-400 uppercase select-none [text-shadow:0_0_3px_rgba(0,0,0,0.95),0_1px_8px_rgba(0,0,0,0.8)] transition-all duration-200 group-hover:text-white">
            {planet.name}
          </span>
        </button>
      ))}

      {/* --- POP-UP MODAL (Matte Glassmorphism Estilo Startup) --- */}
      {activePlanetId !== null && selectedPlanet && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity duration-200">
          {/* Clic fuera del contenedor para cerrar */}
          <div className="absolute inset-0" onClick={() => setActivePlanetId(null)} />

          {/* Contenedor del Pop-up con 16px de rounded corners; los textos largos hacen scroll adentro */}
          <div className="relative flex max-h-full w-full max-w-md flex-col rounded-2xl border border-neutral-800/80 bg-neutral-950/90 p-5 shadow-2xl backdrop-blur-xl select-text transition-all transform scale-100 opacity-100 sm:p-6">

            {/* Header del Pop-up */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-900 pb-3.5">
              <h3 className="font-sans text-xs font-semibold tracking-widest text-white uppercase">
                {selectedPlanet.title}
              </h3>
              <button
                onClick={() => setActivePlanetId(null)}
                className="shrink-0 rounded-lg p-1 text-neutral-500 hover:bg-neutral-900 hover:text-white transition-all focus:outline-none"
                aria-label="Cerrar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Caja de contenido / Relleno personalizable */}
            <div className="mt-4 min-h-[140px] overflow-y-auto overscroll-contain rounded-xl border border-neutral-900 bg-neutral-900/30 p-4 font-sans text-xs leading-relaxed text-neutral-400">
              <p>{selectedPlanet.data}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botón de control Fullscreen */}
      <div className="absolute right-3 top-3 z-40 sm:right-5 sm:top-5">
        <button
          type="button"
          onClick={isExpanded ? exitFullscreen : enterFullscreen}
          className={controlButtonClass}
          aria-label={isExpanded ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
        >
          {isExpanded ? (
            <>
              <Minimize2 size={15} strokeWidth={2} />
              Salir
            </>
          ) : (
            <>
              <Maximize2 size={15} strokeWidth={2} />
              <span className="hidden sm:inline">Pantalla completa</span>
            </>
          )}
        </button>
      </div>

      {/* Overlay de instrucciones dinámico (invisible en la ventana para no pagar su blur) */}
      <div
        className={`pointer-events-none absolute inset-x-4 bottom-8 z-30 flex select-none justify-center transition-all duration-500 sm:bottom-24 ${
          isExpanded ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'
        }`}
      >
        <div className="rounded-xl border border-neutral-800/40 bg-neutral-950/40 px-6 py-3 backdrop-blur-md">
          <p className="font-sans text-xs font-light tracking-wide text-neutral-400 text-center">
            Selecciona un planeta para ver más detalles sobre mí
          </p>
        </div>
      </div>
    </div>
  )
}
