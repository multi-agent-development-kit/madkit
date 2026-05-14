---
name: cleanup
description: "Guía TypeScript/Next.js (.ts/.tsx/.js): refactor seguro, type safety, patrones Next.js. Activar al editar/crear .ts/.tsx o al refactorizar/limpiar código TypeScript/React. NO con .py (cleanup-python) ni manage.py (cleanup-django)."
context: fork
agent: implementer
effort: high
paths: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"]
---

# Limpieza y Codificación TypeScript/Next.js

> **Propósito:** Guía operativa para proyectos Next.js/TypeScript — type safety, patrones Next.js 16, server/client separation, y limpieza de código muerto.

> **Alcance:** Solo proyectos Next.js/TypeScript. Si existe `pyproject.toml` sin `package.json`, usar cleanup-python.

---

## Detección de Proyecto

| Indicador | Stack | Acción |
|-----------|-------|--------|
| `pyproject.toml`, archivos `.py` | Python | Usar cleanup-python |
| `package.json`, `tsconfig.json` | TypeScript/Next.js | Esta skill |

Verificar `package.json` + `tsconfig.json` + archivos `.tsx`. Extraer: frameworks, versiones, ORM, UI library, patrones (App Router, Server Components, etc.).

**Validación (nunca ejecutes build):**
```bash
npm run lint          # Errores de linting e imports
npm run type-check    # Validar TypeScript sin buildear
npm test              # Tests si disponible
```

---

## Shadcn UI

```bash
npx shadcn@latest add <component>    # ✅ Correcto
# npx shadcn-ui add button           # ❌ Incorrecto (paquete viejo)
```

---

## Patrones Next.js 16 (CRÍTICO)

### Async params y searchParams (desde Next.js 15)

En Next.js 15+, `params` y `searchParams` son **Promises**:

```typescript
// Server Component
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ query: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { query } = await searchParams;
}

// Client Component — usa hook use()
'use client';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
}
```

### Sin Async Client Components

Solo **Server Components** pueden ser async. Patrón: Server Component obtiene datos → pasa como props a Client Component. `useSearchParams` en Client Components requiere envolverse en `<Suspense>`.

### Directiva "use client"

Server Components por defecto. Solo agrega `"use client"` cuando necesites React Hooks, event handlers o Browser APIs. **Empuja `"use client"` hacia abajo** al componente más pequeño que lo necesite.

### Directiva "use cache" (Next.js 16)

Directiva de función que reemplaza `unstable_cache`. Añadir `"use cache";` al inicio de la función async. Para revalidación: importar `cacheLife` desde `next/cache` y llamar `cacheLife("hours" | "days" | "weeks")` dentro de la función.

### Turbopack (default en Next.js 16)

Turbopack es el bundler por defecto. No requiere configuración.
Si hay problemas de compatibilidad: `next dev --webpack` como fallback.

### Server Actions: Discriminated Unions

```typescript
"use server";
export type Result<T> = { success: true; data: T } | { success: false; error: string };
// Retornar Result<T> en lugar de lanzar excepciones; el Client Component maneja el toast
```

---

## Seguridad de Tipos

### Sin tipo `any` (cero tolerancia)

- Usa interfaces/types cuando la estructura es conocida
- Usa `unknown` + type guards cuando el tipo es desconocido
- Usa genéricos `<T>` para componentes reutilizables

### Tipos de retorno explícitos

Todas las funciones requieren tipo de retorno explícito. **Excepción:** componentes React (TypeScript infiere JSX correctamente).

---

## Regla Crítica de Configuración

**NUNCA modificar `tsconfig.json`, `eslint.config.mjs` o scripts de `package.json` durante la limpieza.**

## Scope de Limpieza

- **Solo archivos de la tarea actual.** No expandir limpieza a módulos adyacentes. Issues fuera del scope → documentar como nota, no actuar.
- **Antes de eliminar código "muerto":** Verificar que no se use vía dynamic imports, HOCs, lazy loading, context providers, barrel exports u otros mecanismos indirectos. En caso de duda → NO eliminar, preguntar al usuario.
- **`any` / type suppressions en código no modificado por la tarea** → reportar, no eliminar automáticamente.

## Orden de Prioridad de Limpieza

1. **Errores críticos de build** — imports rotos, tipos que fallan compilación
2. **Código muerto confirmado** — funciones/componentes sin ninguna referencia (solo en archivos de la tarea)
3. **Type safety** — `any` explícitos, casteos inseguros, tipos faltantes
4. **Rendimiento** — dependencias circulares, re-renders innecesarios
5. **Dependencias** — no utilizadas, desactualizadas con vulnerabilidades
6. **Organización** — archivos sin uso, estructura inconsistente

## Comandos de Análisis

```bash
npx depcheck --detailed                            # deps no utilizadas
npx ts-unused-exports tsconfig.json                 # exports no usadas
npx madge --circular --extensions ts,tsx .           # dependencias circulares
npm run lint && npm run type-check                   # lint + tipos
```

## Code Smells React/TypeScript

| Code Smell | Corrección |
|------------|-----------|
| Prop drilling (3+ niveles) | Context Provider o composition |
| useEffect abuse (múltiples) | Extraer a custom hooks |
| God Component (>200 líneas) | Dividir en sub-componentes |
| Inline event handlers complejos | Extraer a función nombrada |
| useCallback en todas partes | Solo optimizar cuando sea necesario (perfilar primero) |

## Qué NO Reportar

| NO eliminar | Razón |
|---|---|
| Exportaciones "no utilizadas" de bibliotecas UI (shadcn) | Son variantes intencionales |
| Definiciones de tipo comprehensivas | Son contratos, no bloat |
| Dependencias de build marcadas "no utilizadas" por depcheck | depcheck no entiende pipelines de build |
| Configuraciones de TypeScript/ESLint | Ver regla crítica arriba |

---

## Patrones de Error Handling

**Clases de Error Custom:** jerarquía `AppError extends Error` con campos `code`, `statusCode`, `details`. Subclases: `ValidationError` (400), `NotFoundError` (404). Cada subclase llama `super(message, CODE, statusCode, details)` y usa `Error.captureStackTrace`.

**Agregación de Errores:** acumular en `errors: Error[]` y lanzar `AggregateError` al final — nunca fallar en el primer error cuando se valida un formulario completo.

> **Nota:** El Result type para Server Actions ya está cubierto arriba en la sección de discriminated unions.

---

## Boundaries (cero tolerancia)

- **NUNCA** uses `eslint-disable` en ninguna forma — arregla la causa raíz
- **NUNCA** uses tipo `any` — usa `unknown`, interfaces o genéricos
- **NUNCA** uses `dangerouslySetInnerHTML` sin sanitizar (DOMPurify)
- **NUNCA** expongas API keys en client components — usa `process.env` solo server-side
- **NUNCA** mezcles `className` y `style` — usa `cn()` con clases condicionales
- **SIEMPRE** escapa apóstrofes en JSX: `&rsquo;` o `{"Sarah's"}`

## Validación Post-Limpieza

```bash
npm run lint          # warnings OK, 0 errores nuevos (preexistentes fuera de scope)
npm run type-check    # 0 errores nuevos (preexistentes fuera de scope)
npm test              # todos los tests pasan (si disponible)
```

> Si los tests fallan tras limpieza, la limpieza introdujo una regresión — revertir y corregir.
