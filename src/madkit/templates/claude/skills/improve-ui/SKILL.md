---
name: improve-ui
description: "Transformar UI genérica en diseño profesional. Activar proactivamente al detectar patrones genéricos de IA en la interfaz, o cuando el usuario diga 'feo', 'mejorar diseño', 'pulir UI', 'más profesional', 'se ve genérico', 'mejorar look', 'refinar interfaz'."
---

# Transformacion UI: De IA Generica a Profesional

> Identificar y eliminar patrones genéricos de IA para lograr UI profesional y cohesiva.

---

## Patrones IA — Marcar para Eliminacion

- Gradientes multi-color (azul-a-purpura, verde-a-azul) — eliminar gradientes completamente
- Fuentes genericas (Arial, Inter por defecto, Helvetica, fuentes de sistema)
- Caos de colores — multiples colores compitiendo que fragmentan enfoque
- Contraste pobre — texto negro sobre gris oscuro, blanco sobre negro duro
- Sobrecarga de animacion — fondos en movimiento, transiciones no suaves
- Texto gradient (`bg-clip-text text-transparent`)
- Emojis genericos en lugar de iconos profesionales

## Reglas de Eliminacion

- Remover TODOS los gradientes (si usuario insiste: variacion leve, ej. `bg-blue-400` a `bg-blue-500`)
- Consolidar a sistema de **color primario unico** + secundario complementario
- Reemplazar emojis con iconos Lucide React contextuales
- Limitar decoracion a UN patron sutil (grid baja opacidad, haces de luz, o circulos blur)
- Remover animaciones; si usuario las pide: libreria motion con fade-in on scroll unicamente

---

## Principios de Diseno Profesional

**Enfoque en color unico:** Un primario + un complementario (ej. azul primario, rojo advertencias).

**Tipografia profesional:** Inter, Roboto, Open Sans, Rubik, Poppins, Lato, Space Grotesk, Lexend Deca, Playfair Display (serif), JetBrains Mono (code). Landing pages: 2-3 fuentes (sans-serif + serif acento).

**Dark mode comodo — no negros puros:**
```tsx
bg-slate-900 dark:bg-slate-950   // Comodo
bg-black                          // Evitar
```

**Fondos alternados:** Secciones alternas con `bg-slate-50 dark:bg-slate-900` / `bg-white dark:bg-slate-950`.

**Border radius consistente:** Elegir un sistema (`rounded-lg`, `rounded-xl`, o `rounded-2xl`) y mantenerlo.

---

## Iconos y Tipografia

**Armonia icono-tipografia (strokeWidth):**
```tsx
<h2 className="font-semibold"><Star className="w-6 h-6" strokeWidth={2.5} /> Featured</h2>
<h1 className="font-bold"><Trophy className="w-8 h-8" strokeWidth={3} /> Winner</h1>
```

**Dimensionado de iconos:**
- `text-sm` → `w-4 h-4`
- `text-base` → `w-5 h-5`
- `text-lg` → `w-6 h-6`
- `text-xl` → `w-7 h-7`
- Dentro de botones → `!w-5 !h-5`

**shadcn Button — sin espaciado manual:**
```tsx
// Correcto
<Button><PlusIcon className="!w-5 !h-5" />Add Item</Button>

// Incorrecto — el componente maneja el spacing
<Button><PlusIcon className="!w-5 !h-5 mr-2" />Add Item</Button>
```

---

## Proceso

1. **Analisis:** Leer componente, `globals.css`, `tailwind.config.ts`, `components.json`. Detectar patrones IA
2. **Plan:** Presentar transformacion (patrones a eliminar, sistema de diseno propuesto). Ser flexible — sugerir "color primario consistente" no "usar azul"
3. **Confirmar:** ESPERAR aprobacion del usuario antes de implementar
4. **Implementar:** Eliminar patrones, aplicar diseno profesional
5. **Validar:** Probar modo claro/oscuro, responsive (movil/tablet/desktop), contraste

## Criterios de Exito

- **Test de detección IA**: No identificable como output de IA — parece intencionalmente disenado. Validar: ¿un diseñador senior lo confundiría con trabajo de IA? Si sí, iterar
- Cohesion de color unico con secundario opcional
- Tipografia profesional, espaciado apropiado al contexto
- Dark mode comodo, radius y componentes consistentes
- Iconos con strokeWidth y dimensionado correctos
- Contraste profesional en ambos temas
