---
name: ui-review
context: fork
agent: reviewer
effort: high
description: "Revisión adversarial de UI/UX: mobile-first, WCAG AA, design tokens, consistencia del design system, UX craft y técnicas CSS modernas. Activar cuando el usuario pide 'revisa el diseño', 'revisa la UI', 'check accesibilidad', 'mobile-first review', 'design tokens', 'revisa CSS', 'auditoría visual', 'UI review', 'componentes accesibles', 'estados de la UI', 'formulario UX', 'jerarquía visual'."
---

# UI Review — Revisión Adversarial de Diseño

> **Rol:** Revisor adversarial de UI/UX. Asumo que el diseño FALLA en accesibilidad, usabilidad y técnica hasta evidencia citable. Stack-agnostic: Tailwind, SCSS/BEM, CSS Modules, CSS-in-JS, plain CSS, Vue/Svelte.

No acepto:
- "Probablemente accesible" sin verificar contraste y semántica HTML.
- Breakpoints declarados sin evidencia de que el diseño empieza desde mobile.
- Tokens definidos en un archivo pero hardcodeados en los componentes.
- Componentes con click handlers sin keyboard equivalent.
- Formularios sin estados de error inline ni confirmación de éxito.
- Componentes interactivos sin estado loading, empty o disabled definido.
- Tipografía con tamaños fijos cuando `clamp()` daría fluidez sin media queries.

---

## Paso 0: Detección del stack CSS

| Señal | Stack inferido |
|---|---|
| `tailwind.config.*` presente | Tailwind utilities |
| Archivos `*.module.css` o `*.module.scss` | CSS Modules |
| `styled-components`, `emotion`, `stitches`, `vanilla-extract` en `package.json` | CSS-in-JS |
| Archivos `*.scss` con variables `$` o `@mixin` | SCSS/BEM |
| Solo `*.css` sin ninguno de los anteriores | Plain CSS |
| `design-tokens.*`, `tokens.*`, carpeta `tokens/` o `@tokens-studio` | Design tokens declarados |

Si el stack no es identificable: emitir `[UI-REVIEW WARN] No pude detectar el CSS approach. Adjunta un archivo de estilo de ejemplo o indica el stack.` y esperar input antes de continuar.

---

## Paso 1: Auditoría mobile-first y layout moderno

**Criterio:** el diseño parte del viewport más pequeño y escala hacia arriba.

Verificar:
- ¿Los breakpoints usan `min-width` (mobile-first) o `max-width` (desktop-first → WARNING)?
- ¿Las grids/flexbox tienen comportamiento base funcional para pantallas <375px?
- ¿Touch targets (botones, links, inputs) tienen mínimo 44×44px (WCAG 2.5.8)?
- ¿Texto legible en móvil? (≥16px body, ≥14px secundario)
- ¿Hay overflow horizontal en viewports estrechos?
- ¿Se usan `container queries` (`@container`) donde el componente debería adaptarse a su contenedor, no al viewport? Si hay componentes reutilizables en múltiples contextos de layout y usan solo `@media`, es una oportunidad de modernización.
- ¿La tipografía usa `clamp()` para escala fluida?
  - Patrón canónico: `font-size: clamp(1rem, 2.5vw + 0.5rem, 1.5rem)` — sin media query para tipografía.
  - Si los tamaños son fijos con media query `font-size: 16px / 20px` → WARNING: proponer `clamp()`.
- ¿El espaciado usa escala consistente (múltiplos de 4 u 8)? `gap: 12px` en un sistema de 8pt es una anomalía.

**Clasificación:**

| Hallazgo | Severidad |
|---|---|
| Touch targets <44px | BLOCKING |
| Overflow horizontal en <375px | BLOCKING |
| Estrategia `max-width`-first generalizada | WARNING |
| Tipografía con saltos fijos (oportunidad `clamp`) | INFO |
| Componente reutilizable sin `@container` (oportunidad) | INFO |

---

## Paso 2: Auditoría WCAG AA

### 2.1 Contraste de color

- Texto normal (≤18px / ≤14px bold): ratio ≥4.5:1 vs fondo
- Texto grande (>18px / >14px bold): ratio ≥3:1 vs fondo
- Componentes UI (bordes de inputs, iconos activos, estado focus): ratio ≥3:1 vs fondo adyacente

Si el stack usa tokens de color, verificar que los pares texto/fondo cumplen los ratios. Si están hardcodeados, calcular para los valores detectados.

### 2.2 Semántica HTML

- ¿Landmarks presentes? (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>` si aplica)
- ¿Jerarquía de headings lógica? (`h1` único, sin saltos `h1→h3`)
- ¿Imágenes con `alt` descriptivo? (decorativas: `alt=""`)
- ¿Formularios con `<label>` vinculado a cada `<input>` (via `for`/`id` o wrapping)?
- ¿Iconos sin texto visible con `aria-label` o `aria-hidden="true"` + texto visible adyacente?
- ¿Listas de navegación usando `<ul>/<li>`, no divs planos?

### 2.3 Navegación por teclado

- ¿Elementos interactivos con `:focus-visible` visible y no suprimido globalmente?
- ¿Orden de tabulación sigue el flujo visual lógico?
- ¿Modales/drawers atrapan el foco y lo restauran al cerrarse?
- ¿Dropdowns/selects operables con `Escape` y flechas?

### 2.4 Motion y preferencias del sistema

- ¿Las animaciones/transiciones respetan `@media (prefers-reduced-motion: reduce)`?
  - Patrón canónico: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
- ¿El color scheme respeta `@media (prefers-color-scheme: dark)` o hay un sistema de dark mode declarado?
  - Si no hay dark mode y el proyecto usa tokens de color → WARNING: oportunidad de implementar con `prefers-color-scheme`.

**Clasificación:**

| Hallazgo | Severidad |
|---|---|
| Contraste <4.5:1 en texto normal | BLOCKING |
| Contraste <3:1 en texto grande o UI | BLOCKING |
| `h1` ausente o múltiple | BLOCKING |
| Imagen informativa sin `alt` | BLOCKING |
| Input sin `label` | BLOCKING |
| `:focus-visible` suprimido globalmente sin alternativa | BLOCKING |
| Foco no atrapado en modal abierto | BLOCKING |
| Animaciones sin `prefers-reduced-motion` | WARNING |
| Icono sin nombre accesible | WARNING |
| Sin dark mode con tokens disponibles | INFO |

---

## Paso 3: Auditoría de Design Tokens

### 3.1 Si hay tokens declarados

Verificar que los componentes usan los tokens, no hardcodean equivalentes:
- Colores: `var(--color-primary)` vs `#3B82F6` directo
- Espaciado: `var(--space-4)` o clase `p-4` vs `padding: 16px` directo
- Tipografía: `var(--font-size-base)` vs `font-size: 16px` directo
- Radios, sombras, transiciones, z-index: ídem

Verificar arquitectura de tokens: ¿hay 3 capas?
1. **Primitivos** — `--blue-500: #3B82F6`
2. **Semánticos** — `--color-primary: var(--blue-500)`
3. **Componente** — `--button-bg: var(--color-primary)`

Sin esta jerarquía: WARNING. Los tokens planos sin capa semántica no escalan.

Calcular ratio de uso: `(usos de token / (tokens + hardcoded)) * 100`. Si <70% → WARNING.

### 3.2 Si no hay tokens declarados

- Consistencia implícita (mismos valores repetidos) → WARNING: recomendar extracción a custom properties CSS o config del stack.
- Caos (>5 valores distintos para el mismo concepto, ej: 7 tonos de gris distintos en botones y textos) → BLOCKING: incoherencia que impide escalar.

---

## Paso 4: Consistencia visual y UX craft

### 4.1 Ritmo visual y espaciado

- ¿Los espaciados siguen una escala (8pt: 4, 8, 16, 24, 32, 48, 64px — o la del stack)?
- ¿El `gap` entre elementos relacionados es menor que entre grupos no relacionados? (Ley de proximidad Gestalt)
- ¿Las alineaciones son consistentes? Sin mezclar `text-align: left` y `text-align: center` en el mismo contexto sin intención.

### 4.2 Tipografía

- ¿Hay escala visual clara? (`display > h1 > h2 > h3 > body > caption`) — sin tamaños redundantes.
- ¿`line-height` entre 1.4 y 1.6 para body text? (WCAG 1.4.12 — spacing)
- ¿`max-width` en contenedores de texto largo? (45-75 caracteres es el rango óptimo de legibilidad — `max-width: 65ch`)
- ¿`text-wrap: balance` en headings cortos y `text-wrap: pretty` en párrafos? (evita líneas huérfanas — soporte moderno, sin romper en browsers viejos)

### 4.3 Estados de componentes interactivos

Todo componente interactivo DEBE tener todos sus estados definidos explícitamente. Verificar:

| Estado | Elemento | Señal visual mínima |
|---|---|---|
| `hover` | Button, link, card clickable | Cambio de color o elevación |
| `focus-visible` | Todo interactivo | Ring visible ≥2px |
| `active` | Button | Escala o depresión |
| `disabled` | Button, input | Opacidad reducida + `cursor: not-allowed` |
| `loading` | Button submit, fetch areas | Spinner o skeleton |
| `error` | Input, form | Borde/texto rojo + mensaje inline |
| `success` | Form submit, acción completada | Confirmación visual |
| `empty` | Listas, tablas, dashboards | Ilustración/texto + CTA |

Si algún estado no está definido en código → WARNING. Si un formulario no tiene estado `error` inline → BLOCKING (los errores solo en toast son inaccesibles).

### 4.4 Formularios

- ¿Las etiquetas van SOBRE el campo, no dentro como placeholder permanente?
- ¿La validación es inline y en tiempo real (on blur mínimo, no solo on submit)?
- ¿Los mensajes de error son específicos? ("Email inválido" no es suficiente — "El email debe incluir '@' y un dominio válido")
- ¿El botón submit es visualmente el CTA más prominente del formulario?
- ¿Los campos opcionales están marcados como tal (no los obligatorios con `*`)? — reducir carga cognitiva.
- ¿El orden de campos sigue la lógica del usuario, no la del esquema de base de datos?

### 4.5 Jerarquía visual y carga cognitiva

- **Un solo CTA primario por vista.** Múltiples botones primarios del mismo peso visual compiten y paralizan.
- **Agrupación visual coherente.** Cards, formularios, tablas — ¿los elementos relacionados están visualmente juntos con whitespace que los separa de grupos distintos?
- **Peso visual dirigido.** El elemento más importante de la vista tiene el mayor peso visual (tamaño, contraste, posición). Si todo tiene el mismo peso → nada destaca.
- **Reducir opciones en pantalla.** Si hay >7 opciones simultáneas en un menú o formulario → recomendar progressive disclosure o agrupación.

---

## Paso 5: Implementación técnica CSS moderna

Verificar que el código CSS/JSX usa patrones modernos, no soluciones legacy que aumentan la deuda técnica:

| Patrón legacy | Patrón moderno preferido | Severidad si no se usa |
|---|---|---|
| `float: left/right` para layout | `display: flex` o `display: grid` | BLOCKING |
| `position: absolute` para centrar | `display: flex; align-items: center; justify-content: center` | WARNING |
| Media queries con tamaños fijos y muchos breakpoints | `clamp()` + 2-3 breakpoints semánticos | INFO |
| `margin: 0 auto` + `max-width` en múltiples niveles | `margin-inline: auto` (logical property) | INFO |
| Z-index arbitrarios (`z-index: 9999`) | Escala de z-index con tokens (`--z-modal: 300`, `--z-overlay: 200`) | WARNING |
| Animaciones sin `will-change` ni `transform` (layout thrashing) | Animar solo `transform` y `opacity`; `will-change` solo cuando necesario | WARNING |
| `!important` fuera de reset/utilities globales | Refactorizar especificidad o usar `@layer` | WARNING |
| Vendor prefixes manuales (`-webkit-`, `-moz-`) | PostCSS autoprefixer o propiedades sin prefijo (soporte baseline 2022+) | INFO |
| `vh` en mobile (bug con barra del navegador) | `dvh` (dynamic viewport height) o `svh` para contenedores full-screen | WARNING |

---

## Formato de output

```
## UI Review — [componente/área auditada]

**Stack detectado:** [Tailwind | SCSS/BEM | CSS Modules | CSS-in-JS | Plain CSS | Mixto]
**Ejes auditados:** [mobile-first · WCAG AA · tokens · visual · UX craft · CSS moderno]

### BLOCKING ([N] issues)
- [Eje] `archivo:línea` — descripción concreta. Criterio: WCAG X.X.X / UX / técnico.
  Fix: `{snippet o patrón moderno en 1-2 líneas}`

### WARNING ([N] issues)
- [Eje] `archivo:línea` — descripción. Impacto: {experiencia de usuario afectada}.
  Mejora sugerida: {patrón moderno recomendado}

### INFO — Oportunidades de modernización ([N])
- [Eje] — descripción de la mejora posible. Valor: {qué mejora para el usuario/dev}.

### CLEAN ([N] áreas)
- [Eje] — lo que está bien implementado.

### Conclusión
[1-2 frases: estado general + prioridad de los BLOCKINGs más urgentes]
```

**Regla de cierre:** si hay ≥1 BLOCKING → `[UI-REVIEW BLOCKED] Resolver BLOCKINGs antes de mergear`. Si 0 BLOCKINGs → `[UI-REVIEW PASS] Listo para revisión final.`

**En cada BLOCKING, el fix es obligatorio** — no basta describir el problema; proporcionar el patrón correcto con código o referencia concreta.
