---
name: scroll-stop-web-animations
description: "Prompts coordinados para contenido scroll-stopping: foto ensamblada + vista explosionada + transición de video. Activar ante 'foto deconstruida', 'exploded view', 'transición producto', 'scroll-stop content'."
---

# Skill: Scroll-Stop Web Animations

Genera un conjunto de **3 prompts coordinados** para generadores de imagen/video IA que producen contenido visual scroll-stopping de un producto: foto hero ensamblada, vista explosionada de componentes, transición animada entre ambas. El entregable final es una página HTML con navegación por pestañas, botones de copia y animación de confetti para que el usuario copie cada prompt al instante.

---

## Paso 1: Confirmar el objeto

Preguntar qué objeto quiere si no se especificó. Categorías productivas para scroll-stop:

| Categoría | Ejemplos |
|---|---|
| Tecnología | Laptops, teléfonos, auriculares, cámaras |
| Moda / lujo | Zapatos, relojes, bolsos |
| Vehículos | Coches, bicicletas, drones |
| Alimentación | Smoothies, cócteles, platos emplatados |

Default: **laptop** si el usuario no especifica.

---

## Paso 2: Investigar componentes reales

Antes de redactar el prompt B (deconstruida), identificar **8-15 componentes internos reales** del objeto. La clave del scroll-stop es la **autenticidad**: una vista explosionada de un teléfono debe mostrar la batería, placa, cámara, altavoz, no piezas inventadas.

**Regla operativa:** investigar con WebFetch o conocimiento técnico antes de redactar. La silueta global del objeto debe permanecer reconocible aunque los componentes estén separados.

---

## Paso 3: Redactar Prompt A — Foto ensamblada (hero shot)

**Shape requerido:**

| Campo | Contenido |
|---|---|
| Subject | El objeto centrado, pristine, brand-new, ensamblado |
| Camera angle | 3/4, frontal, top-down — elegir según el objeto |
| Background | Blanco puro `#FFFFFF` o gradiente sutil |
| Lighting | Soft studio (softbox + bounce cards) |
| Photorealism cues | Cámara/lente concretos (Phase One, lente macro), aperture, ISO |
| Aspect ratio | 16:9 |
| Restrictions | Sin texto, sin logos visibles, sin otros objetos en frame |

**Técnica clave:** *Apple-style product photography*. Sharp focus uniforme, reflejos sutiles, sombras suaves, calidad catálogo. Apuntar a 8K downsampled a 4K para detalle máximo.

---

## Paso 4: Redactar Prompt B — Vista explosionada (deconstructed)

**Shape requerido:**

| Campo | Contenido |
|---|---|
| Subject | Componentes del objeto separados en el espacio, manteniendo silueta global |
| Composition | Exploded view diagram con piezas flotando en posiciones lógicas según anatomía real |
| Components | Lista enumerada de los 8-15 componentes investigados en Paso 2 |
| Lighting | Misma dirección y temperatura que Prompt A para coherencia visual |
| Background | Idéntico a Prompt A (blanco puro o mismo gradiente) |
| Restrictions | Sin texto técnico, sin etiquetas, sin líneas de conexión |

**Técnicas clave:**
- *Exploded view* (técnica de ilustración técnica industrial).
- *Focus stacking simulado*: todos los componentes con sharp focus pese a estar a distintas profundidades.
- Mismo aspect ratio y framing que Prompt A — el usuario verá ambas en secuencia.

---

## Paso 5: Redactar Prompt C — Transición de video

**Shape requerido:**

| Campo | Contenido |
|---|---|
| Start frame | Estado de Prompt B (vista explosionada) |
| End frame | Estado de Prompt A (foto ensamblada) |
| Motion | Componentes convergen suavemente al centro hasta ensamblarse |
| Easing | `ease-in-out` o curva equivalente — sin movimiento mecánico abrupto |
| Duration | 3-5 segundos |
| Camera | Estática (foco en la composición, no en movimiento de cámara) |
| Audio cues | Opcional: ASMR mechanical assembly sounds (clicks, encajes) |
| Output spec | 16:9, 30fps mínimo, formato MP4 H.264 |

**Técnicas clave:**
- *ASMR mechanical animation*: ritmo cuidado de encajes que sugiere precisión.
- *Eased motion*: aceleración natural, no lineal.
- *Continuous lighting*: la luz no salta entre frames — coherencia con A y B.

---

## Paso 6: Generar página HTML entregable

Construir un único archivo `.html` autónomo (sin dependencias externas más allá de CDN ligeros) con:

| Componente | Función |
|---|---|
| Header | Título del proyecto + objeto seleccionado |
| Tabs navigation | 3 pestañas: PROMPT A · PROMPT B · PROMPT C |
| Code block por pestaña | Prompt en `<pre>` con `<code>`, scrollable si excede viewport |
| Botón "Copy to clipboard" | Por cada prompt; usa `navigator.clipboard.writeText()` |
| Animación confetti on copy | Feedback visual que el copy fue exitoso (canvas-confetti CDN o equivalente ligero) |
| Sin scripts pesados | El archivo debe abrirse sin servidor; `<script>` inline solo |

**Restricciones del HTML:**
- Cero dependencias instalables. Todo via CDN o inline.
- Mobile-friendly (las pestañas funcionan en táctil).
- Estilo coherente con el objeto (paleta neutra que no compita con la futura imagen).

---

## Reglas

**NUNCA:**
- Generar un prompt sin validar primero el objeto con el usuario.
- Inventar componentes sin investigar la anatomía real del objeto.
- Romper la coherencia visual entre Prompts A y B (mismo lighting, background, framing).
- Entregar prompts en chat sin la página HTML — la HTML es el formato canónico.
- Sugerir prompts engagement-bait, clickbait o piezas de marca de terceros.

**SIEMPRE:**
- Investigar componentes reales antes de redactar Prompt B.
- Mantener silueta global reconocible en la vista explosionada.
- Usar mismo aspect ratio (16:9) en los 3 prompts para continuidad visual.
- Entregar la página HTML completa con los 3 prompts copiables.

---

## Cuándo NO activar

- Solicitud de un solo prompt aislado sin la trilogía → escribir el prompt directo, no esta skill.
- Generación de imagen sin necesidad de transición video → demasiado pesado para el caso de uso.
- Productos sin componentes internos visualmente interesantes (ej: una pelota de tenis lisa) → la vista explosionada no aportaría valor.
