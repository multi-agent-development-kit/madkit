---
name: task-implementation-review
description: "Verificación post-implementación: 1:1 verdict de criterios + testing AAA/Given-When-Then + §10 Engineering Hygiene. Auto-invoca post-reviewer; NO como skill independiente."
context: fork
agent: reviewer
effort: high
---

# Checklist de Revision de Implementacion

> Verificar calidad de implementacion antes de marcar tarea como completa. Omitir secciones que no coincidan con el stack.

---

## Aplicabilidad

| # | Seccion | Aplicar Cuando |
|---|---------|----------------|
| 1 | Type Safety (TS) | Proyecto usa TypeScript |
| 2 | Type Safety (Python) | Proyecto usa Python |
| 3 | ADK | Proyecto usa Google ADK |
| 4 | Drizzle ORM | Proyecto usa Drizzle |
| 5 | Next.js | Proyecto usa Next.js App Router |
| 6 | Server/Client | Existe limite server/client |
| 7 | Seguridad | Siempre |
| 8 | Server Actions | Proyecto usa Server Actions |
| 9 | Testing del cambio | Siempre que la task tenga código de runtime |
| 10 | Engineering Hygiene | Siempre que la task toque código ejecutable |

---

## Modos de ejecución

| Modo | Quién ejecuta | Cuándo |
|---|---|---|
| **Inline** (modo normal) | `reviewer` subagent | `reviewer-agent.md` pre-carga este knowledge vía `skills:` y ejecuta §7-§10 directamente. **No invocar como Skill tool desde el reviewer** — issue [#38719](https://github.com/anthropics/claude-code/issues/38719) impide que subagents invoquen skills. |
| **Fork independiente** | Main session vía Skill tool | Solo cuando el usuario invoca explícitamente desde la sesión principal, o necesita validación adicional sin re-ejecutar el reviewer completo. |

**En el encadenamiento normal** (`implementer → reviewer`): el reviewer ejecuta §7-§10 inline usando el knowledge inyectado. El orquestador (main session) puede invocar esta skill como fork adicional post-reviewer si lo necesita.

---

## 1. Type Safety (TypeScript)

| Patrón | Regla |
|---|---|
| Tipo implícito / `any` explícito | Usar tipo concreto o genérico `<T>` |
| `as User` sin validación | Type guard con `isUser(data)` antes de asumir tipo |
| Función sin tipo de retorno | `: Promise<User \| undefined>` siempre explícito |

## 2. Type Safety (Python)

| Patrón | Regla |
|---|---|
| `Any`, `Dict`, `Optional` de `typing` | Sintaxis moderna: `dict`, `str \| None` (Python 3.10+) |
| Función sin anotación de retorno | `-> Type` obligatorio, incluyendo `-> None` |

## 3. ADK

| Patrón | Regla |
|---|---|
| `os.getenv()` directo | Config centralizada (`from config import settings`) |
| Agent sin `output_key` | Exportar como `root_agent` con `output_key="result"` |

## 4. Drizzle ORM

| Patrón | Regla |
|---|---|
| `sql\`user_id = ${id}\`` raw | Usar operadores type-safe: `eq`, `inArray`, etc. |
| `db.select().from(tabla)` sin columnas | Seleccionar solo columnas necesarias |
| Operaciones multi-paso no atómicas | Envolver en transacción |

## 5. Next.js

| Patrón | Regla |
|---|---|
| `params` como objeto síncrono (Next 15+) | `params: Promise<{id:string}>` → `await params` (server) / `use(params)` (client) |
| `revalidatePath('/items/[id]')` sin tipo | `revalidatePath('/items/[id]', 'page')` — dinámicas requieren tipo |
| Client component `async` | Usar `useEffect` + `useState` |

## 6. Separacion Server/Client

Estructura canónica: `lib/storage-client.ts` (constantes, tipos, funciones puras) + `lib/storage.ts` (server-only, puede re-exportar de `-client`).

Imports server-only nunca en cliente: `@/lib/supabase/server`, `@/lib/drizzle`, `next/headers`.

## 7. Seguridad

| Patrón | Regla |
|---|---|
| Endpoint sin auth | `authenticateRequest()` primero → 401 si falla |
| Input sin validar | `Schema.safeParse(body)` → 400 con issues si falla |
| Error de DB no tipado | Capturar código (`'23505'` → 409); log + 500 para el resto |
| Secret en código cliente | Solo `NEXT_PUBLIC_*` en cliente; resto en server |

## 8. Server Actions

Shape: `'use server'` + resultado tipado `{ success: true; data: T } | { success: false; error: string }`. Flujo: auth check → validación → operación → `revalidatePath('/ruta', 'page')` → return tipado.

---

## 9. Testing del cambio — BLOCKING

> Sustituye al hueco de testing en esta skill. Complementa a la sección §7 de `reviewer-agent.md` (que cubre code review más amplio); aquí se valida el TASK ESPECÍFICO.

| Check | BLOCKING? | Qué buscar |
|---|---|---|
| Test de regresión presente para cada bugfix tocado por la task | SÍ | Si el task doc lista bugfix(es) y NO hay test correspondiente con comentario grep-able `// Regresión: task NNN` (o equivalente por lenguaje) → BLOCK |
| Asserts específicos, no genéricos | SÍ | Tests con `expect(true).toBe(true)`, `toBeTruthy()` solo, `assert.ok()` solo, `assertTrue()` solo → BLOCK. Aceptado: assertion sobre un valor concreto, error tipado o estado verificable |
| Kill-the-mutant pasó | SÍ | Comentar/invertir línea clave del cambio y re-ejecutar tests del task. Si todos pasan tras la mutación → tests son vanity, no protegen regresión. Excepción: cambio puramente declarativo (rename, formato) sin lógica de runtime |

**Patrón de estructuración de tests:** preferir AAA (Arrange-Act-Assert) para tests unitarios. En contexto BDD, preferir Given-When-Then como especificación de comportamiento: Given=precondición del sistema, When=acción del usuario/sistema, Then=expectativa observable y verificable.

**Cuándo NO aplica esta sección 9:**
- Task cuyo alcance es cambio puramente documental o de configuración (sin código de runtime).
- Task que declara explícitamente "sin tests" en "Decisiones aceptadas" del task doc, con justificación.

---

## 10. Engineering Hygiene Criteria — BLOCKING

> Cruza los 4 criterios canónicos del task doc contra el diff final. Complementa §9 del `reviewer-agent` (que verifica contra archivos del diff con verdict 1:1); aquí se valida el TASK ESPECÍFICO post-impl.

| Check | BLOCKING? | Cómo |
|---|---|---|
| Los 4 criterios canónicos del task doc están checkeados [x] tras la implementación | SÍ | Si alguno sigue [ ] tras impl → BLOCK con razón explícita |
| Para cada criterio [x], evidencia citable existe en el diff | SÍ | Citar archivo:línea o comando ejecutado (ej: `npm run lint`, `grep -nE "TODO" src/` con output limpio) |
| Excepción declarada coincide con la realidad del diff | SÍ | Si "Excepción a Criterios de Calidad de Ingeniería" declarada pero el diff incluye código ejecutable → BLOCK por inconsistencia |
| TDD: cada archivo de runtime nuevo tiene archivo de test correspondiente | SÍ | `src/foo.ts` nuevo sin `src/foo.test.ts` o equivalente → BLOCK; declarar excepción en task doc si justificable |

**Cuándo NO aplica esta sección 10:**

- Task doc declara excepción literal `Excepción a Criterios de Calidad de Ingeniería: task no toca código ejecutable (solo <docs/config>).` Y el diff lo confirma (cero archivos ejecutables modificados).
- Task de cambio puramente declarativo (rename de variable, formato) sin lógica de runtime alterada.

---

## Paralelización

Esta skill es **paralelizable post-impl × N por task de la misma wave del DAG**: cuando N tasks completadas con éxito (`reviewer` correlacionado OK), el orquestador DEBE lanzar N `task-implementation-review` (`context: fork` → reviewer) en paralelo en una sola respuesta. Cada instancia valida criterios contra su task doc específico — sin overlap semántico entre tasks de la misma wave.

Skip silente si el task doc no declara criterios verificables (caso raro tras `plan-checker` D1).

Regla canónica: `CLAUDE.md §"Paralelización" / "Paralelización de auditoría/revisión"`.

---

## Errores Comunes

| Error | Arreglo |
|-------|---------|
| Tipo `any` / `Any` | Usar tipo especifico o generico |
| Tipo de retorno faltante | `: ReturnType` (TS) o `-> Type` (Python) |
| SQL raw en Drizzle | Usar `eq`, `inArray`, etc. |
| Client component async | Usar `useEffect` + `useState` |
| Auth faltante en endpoint | Verificar autenticacion primero |
| `revalidatePath('/[id]')` | Agregar tipo: `revalidatePath('/[id]', 'page')` |
| Import server en cliente | Crear archivo `-client.ts` |
| `console.log` debugging | Remover o usar `console.error` |
| `Dict`, `Optional` (Python) | Usar `dict`, `str \| None` |
| `os.getenv()` directo (ADK) | Usar config centralizada |
| Agent no exportado | Exportar como `root_agent` |
