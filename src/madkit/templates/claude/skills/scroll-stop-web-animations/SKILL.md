---
name: scroll-stop-web-animations
description: "Prompts de IA para contenido scroll-stopping: foto ensamblada, vista explosionada, transición de video. Activar cuando se necesiten prompts para imágenes de producto deconstruidas o contenido visual scroll-stop."
---

# Skill: Scroll-Stop Web Animations

Generas un conjunto coordinado de 3 prompts que trabajan juntos para producir contenido de video scroll-stopping:
una foto limpia del producto, su versión deconstruida y una transición de video entre ambas.

Después de generar los prompts, los entregas en una página HTML con navegación por pestañas,
botones de copia con un clic y animación de confetti — para que el usuario pueda copiar y pegar cada prompt al instante.

---

## El Proceso

### Paso 1: Confirmar el Objeto

Pregunta al usuario qué objeto quiere (si no lo ha especificado). Buenos objetos para scroll-stop incluyen:
- Laptops, teléfonos, auriculares, cámaras (productos tecnológicos)
- Zapatos, relojes, bolsos (moda/lujo)
- Coches, bicicletas, drones (vehículos)
- Comida y bebidas (smoothies, cócteles, platos emplatados)
- Cualquier producto con componentes internos o ingredientes interesantes

Por defecto usa **laptop** si el usuario no especifica.

### Paso 2: Generar Prompt A — La Foto Ensamblada

Esta es la imagen hero limpia del producto. Genera un prompt detallado optimizado para generadores de imágenes IA.

**Template:**

```
PROMPT A — ASSEMBLED SHOT

Professional product photography of a [OBJECT] centered in frame, shot from a [ANGLE] angle.
Clean white background (#FFFFFF), soft studio lighting with subtle shadows beneath the object.
The [OBJECT] is pristine, brand-new, fully assembled and closed/complete.

Photorealistic rendering, 16:9 aspect ratio, product catalog quality. Sharp focus across the
entire object, subtle reflections on glossy surfaces. Minimal, elegant, Apple-style product
photography. No text, no logos, no other objects in frame.

Shot on Phase One IQ4 150MP, 120mm macro lens, f/8, studio strobe lighting with large softbox
above and white bounce cards on sides. Ultra-sharp detail, 8K quality downsampled to 4K.
```

**Personaliza según el objeto específico:**
- Ajusta el ángulo de cámara (vista 3/4 funciona mejor para la mayoría de productos)
- Añade detalles específicos del material (aluminio cepillado, plástico mate, textura de cuero, etc.)
- Especifica el estado (laptop cerrada vs abierta, esfera del reloj visible, zapato de perfil, etc.)
- Mantén el fondo blanco — esto es crítico para que la deconstrucción se lea bien

### Paso 3: Generar Prompt B — La Foto Deconstruida

Esta es la versión explosionada/desmontada. Debe sentirse como si el objeto hubiera sido elegantemente
desmontado y cada pieza flotara en el espacio (o para comida/bebidas, una explosión de ingredientes).

**Template:**

```
PROMPT B — DECONSTRUCTED / EXPLODED VIEW

Professional exploded-view product photography of a [OBJECT], deconstructed into its individual
components, all floating in space against a clean white background (#FFFFFF).

Every internal component is visible and separated: [LIST 8-15 SPECIFIC COMPONENTS FOR THE OBJECT].
Each piece floats with even spacing between them, maintaining the general spatial relationship
of where they sit in the assembled product. The arrangement follows a vertical or diagonal
explosion axis.

Soft studio lighting with subtle shadows on each floating piece. Components are pristine and
detailed — you can see textures, screws, ribbon cables, circuit traces. The overall composition
maintains the silhouette/outline of the original object.

Photorealistic rendering, 16:9 aspect ratio, technical illustration meets product photography.
Shot on Phase One IQ4 150MP, focus-stacked for sharpness across all floating elements.
Same lighting setup as the assembled shot for visual continuity.
```

**Listas de componentes por tipo de objeto:**

Para un **laptop**:
- Carcasa unibody de aluminio (tapa superior)
- Panel de pantalla LCD con cable ribbon
- Deck del teclado / carcasa superior
- Módulo del trackpad con motor háptico
- Celdas de batería (celdas individuales visibles)
- Placa lógica / motherboard con chips visibles
- SSD / módulo de almacenamiento
- Ensamblaje del ventilador con heat pipe
- Módulos de altavoces (izquierdo y derecho)
- Mecanismo de bisagra
- Panel de la carcasa inferior
- Patas de goma y tornillos ordenados
- Array de antena WiFi
- Módulo de cámara

Para un **teléfono**:
- Panel trasero de cristal, batería, pantalla OLED, placa lógica, array de módulos de cámara, bandeja SIM,
  rejilla del altavoz, motor Taptic, ensamblaje del puerto Lightning/USB-C, bandas de antena, marco/chasis,
  array de sensor Face ID, bobina de carga inalámbrica

Para un **zapato**:
- Suela exterior, capa de mediasuela/amortiguación, plantilla, paneles superiores de malla/cuero, lengüeta, cordones,
  contrafuerte del talón, puntera, ojales, hilo de costura, elementos de marca

Para **comida/bebidas** (smoothies, cócteles, etc.):
- Usa "explosión" en lugar de "deconstrucción" — el vaso se rompe, el líquido erupciona, los ingredientes
  vuelan hacia afuera en un freeze-frame dramático. Lista cada ingrediente, adorno y elemento (cubos de hielo,
  fragmentos de vidrio, salpicaduras de líquido, trozos de fruta, hierbas, etc.). Enfatiza el estilo de
  fotografía de alta velocidad (1/10000s freeze) para efecto dramático.

Para otros objetos, investiga y lista 8-15 componentes internos reales.

### Paso 4: Generar Prompt C — La Transición de Video

Este prompt instruye a un modelo de video para animar entre los dos estados.

**Template:**

```
PROMPT C — VIDEO TRANSITION (Start Frame → End Frame)

START FRAME: A fully assembled [OBJECT] sitting centered on a white background, product
photography style, soft studio lighting.

END FRAME: The same [OBJECT] elegantly deconstructed into an exploded view — every component
floating in space, separated along a [vertical/diagonal] axis, maintaining spatial relationships.

TRANSITION: Smooth, satisfying mechanical deconstruction animation. The object begins whole
and still. After a brief pause (0.5s), pieces begin to separate — starting from the outer
shell and progressively revealing inner components. Each piece lifts and floats outward along
clean, deliberate paths. Movement is eased (slow-in, slow-out) with slight rotations on
individual pieces to reveal their 3D form. The separation happens over 2-3 seconds in a
cascading sequence, not all at once. Final floating arrangement holds for 1 second.

STYLE: Photorealistic, white background throughout, consistent studio lighting. No camera
movement — locked-off tripod shot. The only motion is the object deconstructing. Satisfying,
ASMR-like mechanical precision. Think Apple product reveal meets engineering visualization.

DURATION: 4-5 seconds total.
ASPECT RATIO: 16:9
QUALITY: High fidelity, smooth 24fps or higher, no artifacts.
```

**Variaciones a ofrecer:**
- **Versión inversa**: Empieza deconstruido, se ensambla (igualmente atractivo)
- **Versión loop**: Ensamblar → pausa → deconstruir → pausa → repetir
- **Versión slow-mo**: Misma animación pero 8-10 segundos, ultra-suave

### Paso 5: Construir y Abrir la Página HTML de Prompts

Después de generar los 3 prompts, entrégalos en una página HTML. Este es el entregable clave
que hace que el skill se sienta premium y fácil de usar.

**Cómo construirla:**

1. Genera el HTML directamente basándote en las especificaciones de diseño descritas en este skill.

2. Reemplaza estos placeholders con el contenido real:
   - `{{OBJECT_NAME}}` — nombre del objeto para el título de la página (ej. "Tropical Smoothie Explosion")
   - `{{HEADING_LINE1}}` — primera(s) palabra(s) del encabezado (ej. "SMOOTHIE")
   - `{{HEADING_LINE2}}` — segunda(s) palabra(s), mostradas con opacidad reducida (ej. "EXPLOSION")
   - `{{TAB_A_NAME}}` — nombre para la pestaña A (ej. "Assembled Shot")
   - `{{TAB_A_SHORT}}` — etiqueta corta móvil para pestaña A (ej. "Assembled")
   - `{{TAB_B_NAME}}` — nombre para la pestaña B (ej. "Explosion Shot" o "Deconstructed")
   - `{{TAB_B_SHORT}}` — etiqueta corta móvil para pestaña B (ej. "Explosion")
   - `{{PROMPT_A}}` — texto completo del Prompt A (texto plano, sin HTML)
   - `{{PROMPT_B}}` — texto completo del Prompt B (texto plano, sin HTML)
   - `{{PROMPT_C}}` — texto completo del Prompt C (texto plano, sin HTML)

3. **Importante**: Al insertar el texto de los prompts, escapa los caracteres `<`, `>` y `&` como entidades
   HTML (`&lt;`, `&gt;`, `&amp;`) para que se rendericen correctamente en el navegador.

4. Escribe el HTML completado en un archivo llamado `prompts.html` en el directorio de trabajo actual
   del usuario (o donde esté trabajando).

5. Abre el archivo en el navegador:
   - Si hay un servidor local corriendo, abre vía URL de localhost
   - De lo contrario, usa `start prompts.html` (Windows), `open prompts.html` (macOS) o `xdg-open prompts.html` (Linux) para abrir
     el archivo directamente

**Características de la página HTML:**
- Interfaz con pestañas A/B/C — haz clic en una pestaña, aparece el prompt. Sin necesidad de scroll.
- Botón de Copiar con un clic en cada prompt
- Animación de confetti se dispara cada vez que copias
- Diseño VoltFlow: Space Grotesk + Archivo + JetBrains Mono, acento lime #BFF549, fondo oscuro #02040a
- Tarjetas con glass-morphism, orbes flotantes de fondo, grid sutil
- Atajos de teclado: 1/2/3 para cambiar pestañas, Cmd+C para copiar el prompt activo
- Totalmente responsive en móvil

### Paso 6: Presentar También los Prompts en el Chat

Después de construir la página HTML, presenta también los prompts en el chat como respaldo, usando este formato:

```
## Tu Set de Prompts Scroll-Stop: [OBJETO]

### PROMPT A — Foto Ensamblada
[pegar en tu generador de imágenes, configurar a 16:9]

{prompt A}

---

### PROMPT B — Foto Deconstruida
[pegar en tu generador de imágenes, configurar a 16:9, opcionalmente referenciar el output del Prompt A como input]

{prompt B}

---

### PROMPT C — Transición de Video
[pegar en tu modelo de video, subir output del Prompt A como frame inicial y output del Prompt B como frame final]

{prompt C}

---

### Configuración Recomendada
- **Generador de imágenes**: Aspecto 16:9, máxima calidad/resolución disponible
- **Modelo de video**: 16:9, 4-5 segundos, máxima calidad
- **Tip**: Genera primero la foto ensamblada, luego referénciarla al generar la versión deconstruida
  para consistencia visual (mismo color, iluminación, ángulo)
```

---

## Buenas Prácticas

1. **La consistencia es clave** — Las versiones ensamblada y deconstruida deben parecer el mismo objeto.
   Mismos materiales, mismos colores, misma dirección de iluminación, mismo ángulo de cámara.
2. **Fondo blanco siempre** — Esto facilita y limpia la construcción del sitio web con scroll-stop-builder.
   También hace la transición de video más limpia.
3. **La precisión de los componentes importa** — No inventes piezas. Usa componentes reales para cada tipo de objeto.
   Esto vende el realismo.
4. **El prompt de video es agnóstico al modelo** — Escríbelo de forma suficientemente descriptiva para que funcione
   en Runway, Kling, Pika, Higgsfield o cualquier otro modelo de video. El usuario solo sube los frames de inicio/fin.
5. **Ofrece la versión inversa** — A veces la animación de ensamblaje (las piezas uniéndose) es incluso más
   satisfactoria que la deconstrucción.
6. **La página HTML es el entregable principal** — La salida en chat es secundaria. La página siempre debe
   generarse y abrirse automáticamente.

---

## Recuperación de Errores

| Problema | Solución |
|---|---|
| El generador de imágenes produce iluminación inconsistente | Añade "match exact lighting direction and intensity from reference image" al Prompt B |
| La deconstrucción se ve aleatoria, no organizada | Enfatiza "maintain spatial relationships" y "explosion along single axis" en el Prompt B |
| La transición de video es muy rápida/brusca | Aumenta la duración a 6-8 segundos, enfatiza "smooth eased motion" y "cascading sequence" |
| Los componentes no se ven realistas | Añade descripciones específicas de material (brushed aluminum, matte black plastic, green PCB with gold traces) |
| El fondo blanco no es puro | Añade "pure white #FFFFFF background, no gradient, no vignette" explícitamente |
| La página HTML no abre | Usa el comando `start` / `open` / `xdg-open` según el SO, o indica al usuario la ruta del archivo para abrir manualmente |
| El prompt contiene caracteres especiales HTML | Siempre escapa `<`, `>`, `&` al insertar en la página HTML |
