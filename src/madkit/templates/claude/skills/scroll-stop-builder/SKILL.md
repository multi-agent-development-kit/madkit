---
name: scroll-stop-builder
description: "Sitios web con scroll-driven animation desde video. Activar cuando el usuario quiera landing tipo Apple con scroll, web donde el video se controle con scroll, o proporcione un video para experiencia scroll-driven."
---

# Skill: Scroll-Stop Builder

Construyes un sitio web de calidad producción donde la reproducción de video se controla con scroll (efecto Apple). DEBES recopilar información del usuario antes de tocar código — no asumas marca, colores ni contenido.

---

## Paso 0: La Entrevista (OBLIGATORIO)

Hazlas de forma conversacional — no como un interrogatorio numerado.

**Campos requeridos:**

| Campo | Pregunta al usuario |
|---|---|
| Nombre de marca | ¿Cuál es el nombre de la marca o producto? |
| Logo | ¿Tienes un archivo de logo? (preferiblemente SVG o PNG) |
| Color de acento | ¿Cuál es tu color de acento principal? (hex o descripción) |
| Color de fondo | ¿Qué color de fondo quieres? (los oscuros funcionan mejor) |
| Estilo general | ¿Qué sensación buscas? (ej., premium tech, lujo, minimalista) |

**Fuente de contenido** — preguntar cuál prefiere:
- **URL existente:** compartir URL → usar `WebFetch` para extraer textos, features, specs.
- **Directo:** pegar descripción, características, specs, testimonios.

**Secciones opcionales** — incluir solo con aceptación explícita:

| Sección | Descripción |
|---|---|
| Testimonios | Cards de testimonios; extrae del sitio web si se proporcionó URL |
| Confetti | Explosión de confetti en CTA o carga de página |
| Card Scanner | Showcase con partículas 3D (Three.js); ideal para tarjeta/dispositivo/objeto |

---

## Prerrequisitos

- **FFmpeg** instalado: `winget install ffmpeg` (Windows) / `brew install ffmpeg` (macOS)
- Video del usuario: MP4, MOV, WebM. Duración ideal: 3-10 segundos.
- **El primer frame DEBE tener fondo blanco.** Si no, avisar y pedir re-exportación o imagen hero separada.

---

## Sistema de Diseño (desde respuestas del usuario)

| Elemento | Regla |
|---|---|
| Fuentes | Space Grotesk (headings), Archivo (body), JetBrains Mono (code) |
| Color de acento | Del usuario → botones, brillos, barras de progreso, resaltados |
| Color de fondo | Del usuario → body, secciones |
| Texto | Derivado del fondo: oscuro→blanco primario; claro→oscuro primario |
| Cards | Glass-morphism: fondo semi-transparente, borde sutil, `backdrop-filter: blur(20px)`, `border-radius: 20px` |
| Botones | Primario = acento + texto contrastante; Secundario = transparente + borde |
| Efectos de fondo | Orbes flotantes (tonos acento, difuminados), cuadrícula sutil, starscape animado |

---

## Técnica: Secuencia de Frames + Canvas

Flujo: extraer frames con FFmpeg → precargar todos → dibujar en canvas según posición del scroll. El scroll mapea a índice de frame (adelante = avanza, atrás = retrocede).

**¿Por qué no `<video currentTime>`?** Los decodificadores no están optimizados para seeking en cada evento de scroll. Canvas + frames pre-extraídos = frame-perfect.

---

## El Proceso de Construcción

### Paso 1: Analizar el Video

```bash
ffprobe -v quiet -print_format json -show_streams -show_format "{VIDEO_PATH}"
```

Extraer duración, fps, resolución, total de frames. Objetivo: 60-150 frames en total.

### Paso 2: Extraer Frames

```bash
mkdir -p "{OUTPUT_DIR}/frames"
ffmpeg -i "{VIDEO_PATH}" -vf "fps={TARGET_FPS},scale=1920:-2" -q:v 2 "{OUTPUT_DIR}/frames/frame_%04d.jpg"
```

JPEG `-q:v 2` (alta calidad, archivos más pequeños que PNG).

### Paso 3: Construir el Sitio Web

Crear un único archivo HTML. Secciones (de arriba a abajo):

| # | Sección | Notas |
|---|---|---|
| 1 | Starscape | Canvas fijo con ~180 estrellas parpadeantes |
| 2 | Loader | Pantalla completa: logo, texto "Loading", barra de progreso acento |
| 3 | Scroll Progress Bar | Fijo arriba, gradiente acento, 3px |
| 4 | Navbar | Logo + marca; se transforma de full-width a pill centrado al hacer scroll |
| 5 | Hero | Título, subtítulo, CTAs, indicador scroll, orbes + cuadrícula |
| 6 | Scroll Animation | Canvas sticky con secuencia de frames + annotation cards snap-stop |
| 7 | Specs | 4 números con count-up al hacer scroll |
| 8 | Features | Cards glass-morphism en cuadrícula |
| 9 | CTA | Llamada a la acción |
| 10 | Testimonials | *(solo si aceptó)* Cards con arrastre horizontal |
| 11 | Card Scanner | *(solo si aceptó)* Showcase Three.js |
| 12 | Footer | Marca + enlaces |

Para detalles completos de implementación de cada sección, leer `references/sections-guide.md`.

### Paso 4: Patrones Clave de Implementación

| Patrón | Regla |
|---|---|
| Canvas Retina | Escalar con `window.devicePixelRatio` en width/height; `style.width/height` en CSS px |
| Cover-fit (desktop) | Frame llena borde a borde |
| Contain-fit con zoom (móvil) | Objeto centrado y visible |
| Annotation cards snap-stop | `data-show`/`data-hide` en puntos de progreso; scroll congela ~600ms en cada card (JS snap: detecta zona, hace scroll a posición exacta, bloquea overflow) |
| Navbar pill | Full-width → pill centrado (max-width ~820px) con glass-morphism al hacer scroll |
| Count-up specs | `easeOutExpo`, escalonado 200ms, pulso de brillo acento; activado con `IntersectionObserver` |

### Paso 5: Personalizar Contenido y Servir

Todo el contenido viene de la entrevista (Paso 0) — nunca Lorem ipsum. Adaptar: título/subtítulo hero, etiquetas y stats de annotation cards, números de specs, features, CTA, testimonios.

```bash
cd "{OUTPUT_DIR}" && python -m http.server 8080   # No sirve desde file://
```

---

## Responsividad Móvil

| Componente | Adaptación |
|---|---|
| Annotation cards | Diseño una línea: solo número + título en flex. Ocultar párrafo, stats, etiquetas. `bottom: 1.5vh` |
| Altura scroll animation | 350vh (desktop) → 300vh (tablet) → 250vh (móvil) |
| Navbar | Solo logo + pill; ocultar enlaces |
| Testimonials | Scroll táctil con snap a bordes de cards |
| Feature cards | Una columna |
| Specs | Cuadrícula 2×2 |

---

## Buenas Prácticas

| Regla | Por qué |
|---|---|
| `requestAnimationFrame` para dibujar | Nunca dibujar directamente en el handler de scroll |
| `{ passive: true }` en scroll listener | Habilita optimizaciones del navegador |
| Canvas con `devicePixelRatio` | Nítido en pantallas Retina |
| Precargar todos los frames antes de mostrar | Sin pop-in durante el scroll |
| Deduplicación de frames | Solo llamar `drawFrame` cuando cambia el índice |
| Sin `scroll-behavior: smooth` | Interfiere con el mapeo frame-accurate |
| Sin librerías pesadas | JS vanilla; solo Three.js si card scanner activo |
| Canvas sticky | `position: sticky` mantiene el canvas fijo mientras el contenedor scroll se mueve |

---

## Recuperación de Errores

| Problema | Solución |
| --- | --- |
| Los frames no cargan | Verificar rutas de archivo; servidor local corriendo (no `file://`) |
| La animación es entrecortada | Reducir frames, asegurar JPEG no PNG, verificar tamaños (<100KB c/u) |
| El canvas se ve borroso | Verificar escalado con `devicePixelRatio` |
| El scroll muy rápido/lento | Ajustar altura `.scroll-animation` (200vh=rápido, 500vh=lento, 800vh=cinemático) |
| Cards móvil se superponen | Diseño compacto una línea, posicionar en `bottom: 1.5vh` |
| Snap-stop se siente brusco | Reducir `HOLD_DURATION` a 400ms o aumentar `SNAP_ZONE` |
| Estrellas muy brillantes/tenues | Ajustar opacidad del canvas starscape (por defecto 0.6) |
| Primer frame no es blanco | Pedir re-exportación con frame de apertura blanco |
