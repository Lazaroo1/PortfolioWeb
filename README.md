# Portfolio Web - Lázaro Díaz

Portafolio personal de Lázaro Daniel Díaz Bojórquez, estudiante de Ciencias de la Computación y Tecnologías de la Información en la Universidad del Valle de Guatemala.

Sitio publicado: https://lazaroo1.github.io/PortfolioWeb/

## Sobre El Proyecto

Este portafolio busca mostrar quién soy como desarrollador, pero también cómo pienso. No quería hacer solo una página con tarjetas de proyectos y una lista de tecnologías. La idea fue construir una experiencia que se sintiera personal, técnica y cuidada, sin dejar de ser fácil de navegar.

El sitio está dividido en secciones simples: inicio, sobre mí, proyectos, tecnologías y contacto. La parte visual más fuerte está en el fondo animado y en la sección del agujero negro. Ambas animaciones están hechas con shaders y código procedural, no con imágenes ni GIFs. Esto conecta bastante con mis intereses personales: la matemática, el universo, la física y la programación gráfica.

## Reflexión

### ¿A Qué Audiencia Está Dirigido?

Este portafolio está dirigido principalmente a reclutadores, equipos de ingeniería y empresas que buscan perfiles full stack con interés fuerte en frontend, backend, arquitectura, bases de datos y experiencia de usuario. También está pensado para profesores o personas técnicas que quieran revisar no solo los proyectos terminados, sino la intención detrás de las decisiones.

La audiencia que imaginé no es alguien que quiere ver una página demasiado cargada de efectos solo por impresionar. Pensé más en alguien que quiere entrar, entender rápido qué hago, ver proyectos concretos, revisar el stack y encontrar una forma clara de contactarme. Por eso intenté balancear dos cosas: una presentación visual memorable y una estructura bastante directa.

El portafolio apunta a oportunidades full stack, prácticas profesionales, proyectos reales o equipos donde se valore tanto la calidad técnica como la capacidad de aprender cosas nuevas. Por eso los proyectos no están presentados solo con screenshots. Cada uno tiene problema, solución, stack, métricas y links cuando aplica. La intención es mostrar que no solo construyo interfaces, sino sistemas completos con decisiones de arquitectura, datos, deploy, pruebas y experiencia de usuario.

### ¿Qué Tecnologías Elegí Usar Y Por Qué?

Elegí React con TypeScript porque quería una base sólida para construir componentes reutilizables y mantener el código ordenado. TypeScript ayuda bastante a evitar errores tontos, sobre todo cuando hay datos estructurados como proyectos, skills, métricas y modales.

Usé Vite porque es rápido, simple y funciona muy bien para un portafolio. El tiempo de desarrollo es cómodo, el build es ligero y el deploy a GitHub Pages no requiere una configuración complicada.

Para estilos usé Tailwind CSS. Me permite trabajar rápido, mantener consistencia visual y ajustar responsive sin tener que saltar demasiado entre archivos. También encaja bien con el tipo de diseño que quería: oscuro, limpio, con bordes suaves, texto bien espaciado y componentes compactos.

Usé Framer Motion para animaciones de entrada, transiciones y detalles suaves. No quería animaciones demasiado pesadas, sino movimientos que ayudaran a que la página se sintiera viva. Por ejemplo, las secciones aparecen al entrar en viewport y los proyectos tienen pequeñas respuestas al hover.

También usé lucide-react para iconos. Es una librería ligera, consistente y suficiente para botones, links, contacto, navegación y acciones.

La parte más experimental fue WebGL. El fondo de líneas y el agujero negro se generan con shaders. En el fondo se calculan ondas senoidales por píxel para crear líneas animadas. En el agujero negro se usa una idea de raymarching: se lanza un rayo por píxel y se va modificando su dirección para simular una especie de lente gravitacional. No es una simulación física exacta de relatividad general, pero sí toma una idea parecida: mientras más cerca pasa un rayo del centro, más se curva visualmente.

Además, el blackhole usa un pipeline de varios pasos con framebuffers para componer la imagen, generar blur y dar bloom. Esto fue importante porque quería que la escena no pareciera una imagen pegada, sino una pieza viva dentro del portafolio.

### ¿Qué Tecnología Decidí No Usar Y Por Qué?

Decidí no usar React Three Fiber ni Three.js para la simulación del agujero negro. Aunque Three.js aparece como dependencia del proyecto, la escena del blackhole está trabajada con WebGL y shaders directamente. La razón fue que quería entender mejor qué estaba pasando por debajo: cómo se dibuja cada píxel, cómo se pasan uniforms, cómo se usan buffers, cómo se compone una escena con varios pasos y cómo se maneja memoria de GPU.

React Three Fiber habría hecho más fácil montar una escena 3D clásica con objetos, cámara y luces, pero para este caso no era lo que buscaba. El agujero negro no está pensado como un modelo 3D tradicional, sino como una simulación procedural de pantalla completa. Para eso, trabajar más cerca del shader tenía más sentido.

También decidí no usar un backend ni una base de datos para este portafolio. Pude haber conectado una API para proyectos o mensajes de contacto, pero para esta entrega habría agregado complejidad que no aportaba mucho a la audiencia principal. El contenido del portafolio es mayormente estático, así que mantenerlo en archivos TypeScript es suficiente, más fácil de desplegar y más estable.

### ¿Dónde Me Arriesgué Y Dónde La Jugué Seguro?

Me arriesgué en la parte visual y matemática. El blackhole, el fondo con shaders, el texto animado del hero y los modales del universo personal son piezas más delicadas que una interfaz normal. Pueden fallar por performance, por compatibilidad del navegador o por detalles de WebGL. Aun así decidí hacerlo porque conecta con mi personalidad y con mis intereses. Quería que el portafolio tuviera algo que se sintiera mío.

También me arriesgué al hacer que la sección "Sobre mí" no fuera solo texto. En lugar de escribir una descripción larga, agregué una escena interactiva con planetas que abren partes personales de mi forma de pensar. Esto puede no ser lo más tradicional, pero ayuda a que el portafolio no se sienta como una plantilla.

La jugué seguro en la estructura general. La navegación es simple, las secciones son claras y los botones hacen lo que se espera. Los proyectos están en una lista fácil de escanear, con modal para detalle. El contacto tiene email copiable y links directos. El CV está disponible desde el hero. Esto era importante porque, aunque haya una parte experimental, el portafolio sigue teniendo que funcionar como herramienta profesional.

También la jugué seguro usando React, TypeScript, Tailwind y Vite. Son herramientas conocidas, estables y apropiadas para este tipo de proyecto. Me dieron una base confiable para poder gastar más energía en la experiencia visual y no en pelear con configuración.

### Si Tuviera Otra Semana, ¿Qué Mejoraría?

Primero mejoraría más la accesibilidad. El sitio ya tiene navegación por teclado en partes importantes y textos visibles, pero podría revisar con más calma labels, focus states, contraste en algunos textos secundarios y soporte para usuarios que prefieren menos movimiento.

También haría una revisión de performance más profunda. Los shaders corren bien, pero WebGL siempre merece cuidado. Me gustaría agregar una opción para reducir efectos visuales en dispositivos menos potentes, pausar animaciones cuando no están en pantalla y revisar métricas reales con Lighthouse.

Otra mejora sería pulir más el contenido de los modales del agujero negro. Ahora funcionan como una parte personal del portafolio, pero podrían tener mejor estructura, tal vez con pequeñas secciones, links o detalles visuales más finos.

También agregaría tests para componentes importantes. No creo que todo portafolio necesite una suite gigante de pruebas, pero sí tendría sentido probar interacciones clave como abrir proyectos, navegar modales, copiar email y descargar el CV.

Finalmente, mejoraría el sistema de datos para que todo el contenido esté centralizado. Algunas cosas ya viven en `src/data/portfolio.ts`, pero los proyectos detallados y los planetas podrían moverse a archivos de datos separados para que el mantenimiento sea más limpio.

## Tecnologías Usadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- lucide-react
- WebGL y GLSL shaders
- HTML Canvas
- GitHub Pages
- gh-pages

## Créditos

La simulación del agujero negro está basada e inspirada en el shader de Shadertoy: https://www.shadertoy.com/view/lstSRS

El portafolio adapta esa idea a un componente de React con WebGL, canvas, framebuffers y lógica propia de interacción para integrarlo con el resto de la página.
