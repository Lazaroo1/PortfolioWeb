// ============================================================
// PORTFOLIO DATA — Lázaro Daniel Díaz Bojórquez
// Editar aquí para actualizar todo el sitio
// ============================================================

export const OWNER = {
  name: 'Lázaro Daniel Díaz Bojórquez',
  initials: 'LD',
  title: 'Full Stack Engineer',
  location: 'Guatemala, GT',
  university: 'Universidad del Valle de Guatemala — CS, 6° semestre',
  email: 'ldbojorquez@gmail.com',
  github: 'https://github.com/Lazaroo1',
  linkedin: 'https://linkedin.com/in/lázaro-díaz-146b5b39a',
  cvUrl: '/PortfolioWeb/lazaro-cv.pdf',
  description:
    'Construyo plataformas full stack con enfoque en arquitectura limpia, ' +
    'experiencia de usuario y código que escala. Actualmente en 6° semestre de ' +
    'CS & TI en UVG y con experiencia en proyectos reales de mayor complejidad.',
}

export const HERO_TEXTS = [
  'Full Stack Engineer',
  'React & TypeScript',
  'Node.js & PostgreSQL',
  'Clean Architecture',
  'Docker & CI/CD',
  'Go',
  'Android & Kotlin',
  'Builder',
]

export const STATS = [
  { value: '5+', label: 'Proyectos reales' },
  { value: '316', label: 'Tests escritos' },
  { value: '10+', label: 'Tecnologías' },
  { value: 'B2', label: 'Inglés' },
]

export interface Project {
  title: string
  description: string
  year: string
  tags: string[]
  link: string | null
  hasVideo: boolean
  videoUrl?: string
  imageUrl?: string
}

export const PROJECTS: Project[] = [
  {
    title: 'Bodega de Licores',
    description:
      'Sistema empresarial completo para gestión de inventario, ventas y operaciones. ' +
      'Arquitectura por capas, RBAC con Clerk, CI/CD y 316 tests Jest.',
    year: '2026',
    tags: ['Node.js', 'TypeScript', 'Vue 3', 'PostgreSQL', 'Docker', 'GitHub Actions'],
    link: null,
    hasVideo: true,
    videoUrl: 'ZesBuWq-PbQ', //  el ID de YouTube (solo el ID, ej: "dQw4w9WgXcQ")
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=560&auto=format&fit=crop&q=80',
  },
  {
    title: 'OmniMarket',
    description:
      'Tienda retail full stack con SQL avanzado visible en la UI, ' +
      'transacciones ACID, control de acceso por roles y generación de reportes PDF.',
    year: '2026',
    tags: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Docker'],
    link: 'https://github.com/Lazaroo1/proyecto2-db1',
    hasVideo: false,
    imageUrl: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=560&auto=format&fit=crop&q=80',
  },
  {
    title: 'MoodNutri',
    description:
      'App Android que recomienda recetas según el estado de ánimo. ' +
      'Gemini API para reconocimiento de ingredientes desde imágenes, OpenAI para recetas.',
    year: '2025',
    tags: ['Kotlin', 'Jetpack Compose', 'Firebase', 'Gemini API', 'OpenAI API'],
    link: 'https://github.com/Programacion-de-Plataformas-Mobiles/MoodNutri',
    hasVideo: false,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=560&auto=format&fit=crop&q=80',
  },
  {
    title: 'Series Tracker',
    description:
      'API REST en Go con Swagger/OpenAPI embebido, búsqueda, paginación, ' +
      'ratings y frontend lightweight. Deploy dockerizado en Railway.',
    year: '2026',
    tags: ['Go', 'SQLite', 'Docker', 'Railway', 'OpenAPI'],
    link: 'https://github.com/Lazaroo1/proyecto1-STW-frontend',
    hasVideo: false,
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=560&auto=format&fit=crop&q=80',
  },
]

export interface SkillCategory {
  category: string
  icon: string
  skills: string[]
}

export const SKILLS: SkillCategory[] = [
  {
    category: 'Frontend',
    icon: 'monitor',
    skills: ['React', 'Vue 3', 'TypeScript', 'Tailwind CSS', 'Vite', 'Pinia'],
  },
  {
    category: 'Backend',
    icon: 'server',
    skills: ['Node.js', 'Express', 'Go', 'FastAPI', 'Laravel 11', 'Elysia'],
  },
  {
    category: 'Bases de Datos',
    icon: 'database',
    skills: ['PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Prisma ORM', 'Neo4j'],
  },
  {
    category: 'DevOps & Cloud',
    icon: 'cloud',
    skills: ['Docker', 'GitHub Actions', 'Nginx', 'GCP', 'Railway', 'Cloudflare'],
  },
  {
    category: 'Mobile',
    icon: 'smartphone',
    skills: ['Kotlin', 'Jetpack Compose', 'React Native', 'Firebase', 'Room DB'],
  },
  {
    category: 'IA & APIs',
    icon: 'brain',
    skills: ['OpenAI API', 'Gemini API', 'OpenRouter', 'Swagger/OpenAPI', 'Retrofit'],
  },
]

export const NAV_ITEMS = [
  { name: 'Inicio', href: '#hero' },
  { name: 'Sobre mí', href: '#about' },
  { name: 'Proyectos', href: '#projects' },
  { name: 'Skills', href: '#skills' },
  { name: 'Contacto', href: '#contact' },
]
