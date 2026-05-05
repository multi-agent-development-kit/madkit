---
name: scroll-stop-builder
description: "Sitios web con scroll-driven animation desde video. Activar cuando el usuario quiera landing tipo Apple con scroll, web donde el video se controle con scroll, o proporcione un video para experiencia scroll-driven."
---

# Skill: Scroll-Stop Builder

Tomas un archivo de video y construyes un sitio web de calidad producción donde la reproducción del video
se controla con la posición del scroll — creando un efecto dramático tipo Apple de scroll-stopping.

Antes de construir cualquier cosa, DEBES recopilar información del usuario mediante una breve entrevista.
No asumas nombres de marca, colores ni contenido — todo se personaliza por proyecto.

---

## Paso 0: La Entrevista (OBLIGATORIO)

Antes de tocar código o extraer frames, haz estas preguntas al usuario. No te saltes
este paso — el propósito de esta skill es construir algo a medida, no genérico.

### Preguntas Requeridas

Hazlas de forma natural y conversacional — no como un interrogatorio numerado:

1. **Nombre de marca** — "¿Cuál es el nombre de la marca o producto para este sitio?"
2. **Logo** — "¿Tienes un archivo de logo que pueda usar? (preferiblemente SVG o PNG)"
3. **Color de acento** — "¿Cuál es tu color de acento principal? (código hex, o descríbelo y te sugiero opciones)"
4. **Color de fondo** — "¿Qué color de fondo quieres? (los fondos oscuros funcionan mejor para este efecto)"
5. **Estilo general** — "¿Qué sensación general buscas? (ej., lanzamiento tech premium, lujo, juguetón, minimalista, audaz)"

### Obtención de Contenido

Pregunta al usuario cómo quiere proporcionar el contenido del sitio:

- **Opción A: Basado en un sitio web existente** — "¿Está basado en un sitio web existente? Si es así, comparte la URL y extraeré el contenido real (nombre del producto, características, specs, textos) para poblar el sitio."
- **Opción B: Pégalo directamente** — "Si no tienes un sitio web, puedes pegar el contenido que quieras — descripciones de producto, listas de características, specs, testimonios, etc."

Si el usuario proporciona una URL, usa `WebFetch` para obtener el contenido de la página y extraer
textos relevantes, detalles del producto, descripciones de características, números de specs y cualquier otro contenido utilizable.

### Secciones Opcionales

Pregunta si el usuario quiere incluir estas secciones:

- **Testimonios** — "¿Quieres una sección de testimonios? Si es así, proporciona los testimonios o los extraeré del sitio web que compartiste."
- **Confetti** — "¿Quieres un efecto de explosión de confetti en algún lugar? (ej., al hacer clic en el botón CTA, al cargar la página)"
- **Card Scanner** — "¿Quieres una sección de showcase con partículas 3D? (basada en Three.js — ideal para mostrar una tarjeta, dispositivo u objeto)"

Solo incluye estas secciones si el usuario acepta explícitamente.

---

## Prerrequisitos

- **FFmpeg** debe estar instalado:
  - **Windows**: `winget install ffmpeg`
  - **macOS**: `brew install ffmpeg`
- El usuario proporciona un archivo de video (MP4, MOV, WebM, etc.)
- El video debe ser relativamente corto (3-10 segundos es ideal)
- **El primer frame del video DEBE tener fondo blanco.** Esto es un requisito estricto — la toma inicial debe mostrar el producto/objeto limpio sobre blanco. Si el video del usuario no comienza así, avísale y pide una re-exportación o una imagen hero separada con fondo blanco.

---

## Sistema de Diseño (Construido desde las Respuestas del Usuario)

Una vez completada la entrevista, construye el sistema de diseño a partir de las respuestas del usuario:

- **Fuentes**: Space Grotesk (encabezados), Archivo (cuerpo), JetBrains Mono (code/mono)
- **Color de acento**: De la respuesta del usuario (usado para botones, brillos, barras de progreso, resaltados)
- **Color de fondo**: De la respuesta del usuario (usado para body, secciones)
- **Colores de texto**: Derivados del fondo — si fondo oscuro, usar blanco primario + secundario atenuado; si fondo claro, usar oscuro primario + secundario atenuado
- **Selección**: Fondo con color de acento y texto contrastante
- **Scrollbar**: Track oscuro con thumb en gradiente usando color de acento, brillo al hover
- **Cards**: Glass-morphism — fondo semi-transparente, borde sutil, `backdrop-filter: blur(20px)`, `border-radius: 20px`
- **Botones**: Primario = fondo color de acento con texto contrastante + brillo de acento; Secundario = transparente con borde blanco/oscuro
- **Efectos**: Orbes flotantes de fondo (tonos del color de acento, difuminados), overlay sutil de cuadrícula, starscape animado
- **Nombre de marca y logo**: Usados en navbar, footer, loader y donde aparezca branding

---

## Técnica: Secuencia de Frames + Canvas

El enfoque más fiable para scroll-driven video:

1. **Extraer frames** del video usando FFmpeg
2. **Precargar todos los frames** como imágenes con un indicador de carga
3. **Dibujar frames en un canvas** según la posición del scroll
4. La posición del scroll se mapea a un índice de frame — hacer scroll hacia adelante avanza el video, hacia atrás lo retrocede

Esta es la misma técnica que usa Apple en sus páginas de producto.

**¿Por qué no `<video>` con `currentTime`?**
Los decodificadores de video del navegador no están optimizados para seeking en cada evento de scroll. Canvas + frames
pre-extraídos es ultra fluido y da control frame-perfect.

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

Usar `-q:v 2` para JPEG de alta calidad. Usar JPEG y no PNG para archivos más pequeños.

### Paso 3: Construir el Sitio Web

Crear un único archivo HTML. El sitio tiene estas secciones (de arriba a abajo):

1. **Starscape** — Canvas fijo detrás de todo con estrellas animadas que parpadean
2. **Loader** — Pantalla completa con logo de la marca, texto "Loading", barra de progreso con color de acento
3. **Scroll Progress Bar** — Fijo arriba, gradiente de acento, 3px de alto
4. **Navbar** — Logo + nombre de marca, se transforma de ancho completo a pill centrado al hacer scroll
5. **Hero** — Título, subtítulo, botones CTA, indicador de scroll, orbes de fondo + cuadrícula
6. **Scroll Animation** — Canvas sticky con secuencia de frames, annotation cards con snap-stop
7. **Specs** — Cuatro números estadísticos con animación count-up al hacer scroll
8. **Features** — Cards con glass-morphism en una cuadrícula
9. **CTA** — Sección de llamada a la acción
10. **Testimonials** — *(solo si el usuario aceptó)* Cards de testimonios con arrastre horizontal
11. **Card Scanner** — *(solo si el usuario aceptó)* Showcase de partículas con Three.js
12. **Footer** — Nombre de marca y enlaces

Para detalles completos de implementación de cada sección, leer `references/sections-guide.md`.

### Paso 4: Patrones Clave de Implementación

**Renderizado de canvas con soporte Retina:**

```javascript
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;
canvas.style.width = window.innerWidth + 'px';
canvas.style.height = window.innerHeight + 'px';
```

**Cover-fit (escritorio) — contain-fit con zoom (móvil):**
En escritorio, usar cover-fit para que el frame llene borde a borde. En móvil, usar un enfoque
de contain-fit ligeramente ampliado para que el objeto se mantenga centrado y visible.

**Annotation cards con snap-stop scroll:**
Las annotation cards aparecen en puntos específicos de progreso del scroll (atributos data-show/data-hide).
El scroll SE CONGELA brevemente en cada posición de card — creando un efecto "boom, boom, boom" donde
cada card aparece al detenerte. Usa snap basado en JS: detecta cuando el progreso del scroll entra en una zona de snap,
hace scroll a la posición exacta, bloquea el overflow del body por ~600ms, y luego lo libera.
El número de annotation cards es flexible — ajústalo al contenido que proporcione el usuario.

**Transformación navbar scroll-to-pill:**
La navbar comienza a ancho completo, luego al hacer scroll se encoge a una forma de pill centrada (max-width ~820px)
con esquinas redondeadas y fondo glass-morphism.

**Animación count-up:**
Los números de specs se animan de 0 al valor objetivo con easing easeOutExpo, escalonados 200ms entre sí.
Los números obtienen un pulso de brillo con el color de acento mientras cuentan. Se activa con IntersectionObserver.

**Starscape animado:**
Un canvas fijo detrás de todo con ~180 estrellas que se desplazan lentamente y parpadean. Cada estrella tiene
velocidad de desplazamiento, velocidad/fase de parpadeo y opacidad aleatorias. Crea un fondo sutil con vida.

### Paso 5: Personalizar Contenido

Todo el contenido viene de la entrevista (Paso 0). Usa el nombre real de la marca, los detalles reales del producto,
y los textos reales — nunca uses texto placeholder "Lorem ipsum". Si el contenido vino de una URL, usa el texto
real de ese sitio. Adaptar:

- Título y subtítulo del hero
- Etiquetas, descripciones y estadísticas de las annotation cards
- Números y etiquetas de specs
- Cards de features
- Texto del CTA
- Testimonios (si se incluyeron)

### Paso 6: Servir y Probar

```bash
cd "{OUTPUT_DIR}" && python -m http.server 8080
```

Abrir `http://localhost:8080` y probar. Luego abrir la URL del navegador para el usuario.

---

## Responsividad Móvil

Adaptaciones clave para móvil:

- **Annotation cards**: Diseño compacto de una línea — ocultar texto de párrafo, números de estadísticas y etiquetas.
  Mostrar solo número de card + título en una fila flex. Posicionar en la parte inferior del viewport.
- **Altura de scroll animation**: Reducir de 350vh (escritorio) a 300vh (tablet) a 250vh (móvil)
- **Navbar**: Ocultar enlaces en móvil, mostrar solo logo + forma pill
- **Testimonials** (si se incluyeron): Con scroll táctil, snap a los bordes de las cards
- **Feature cards**: Apilar en una sola columna
- **Specs**: Cuadrícula 2x2 en móvil

---

## Buenas Prácticas

1. **`requestAnimationFrame` para dibujar** — Nunca dibujar directamente en el handler de scroll
2. **`{ passive: true }` en el listener de scroll** — Habilita optimizaciones de scroll
3. **Canvas con `devicePixelRatio`** — Nítido en pantallas Retina
4. **Precargar todos los frames antes de mostrar** — Sin pop-in durante el scroll
5. **Deduplicación de frames** — Solo llamar a `drawFrame` cuando cambia el índice del frame
6. **Sin `scroll-behavior: smooth`** — Interferiría con el mapeo frame-accurate del scroll
7. **Sin librerías JS pesadas** — JS vanilla puro excepto Three.js para card scanner (si se incluye)
8. **Canvas sticky** — `position: sticky` mantiene el canvas fijo en el viewport mientras el contenedor de scroll se mueve
9. **Primer frame blanco** — El video debe comenzar con un fondo blanco limpio

---

## Recuperación de Errores

| Problema | Solución |
| --- | --- |
| Los frames no cargan | Verificar rutas de archivo, asegurar que el servidor local está corriendo (no se puede cargar desde `file://`) |
| La animación es entrecortada | Reducir cantidad de frames, asegurar JPEG y no PNG, verificar tamaños de archivo (<100KB cada uno) |
| El canvas se ve borroso | Asegurar que el escalado con `devicePixelRatio` está aplicado |
| El scroll se siente muy rápido/lento | Ajustar la altura de `.scroll-animation` (200vh=rápido, 500vh=lento, 800vh=cinemático) |
| Las cards en móvil se superponen al contenido | Usar diseño compacto de una línea, posicionar en `bottom: 1.5vh` |
| El snap-stop se siente brusco | Reducir HOLD_DURATION a 400ms o aumentar SNAP_ZONE |
| Las estrellas muy brillantes/tenues | Ajustar la opacidad del canvas de starscape (por defecto 0.6) |
| El primer frame no es blanco | Pedir al usuario que re-exporte el video con frame de apertura blanco |
