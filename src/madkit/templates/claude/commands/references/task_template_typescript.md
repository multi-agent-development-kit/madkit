# Plantilla de Tarea de IA para TypeScript/Next.js

> Esta plantilla crea documentos de tareas para desarrollo TypeScript/Next.js con IA. Complementa la plantilla base (`task_template.md`) y agrega análisis, patrones y validación específicos de TypeScript.
>
> **Cabecera de Metadatos opcional:** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves).

---

## CRÍTICO: Protocolo de Creación de Documentos de Tarea

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementar cambios directamente.**

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoría de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa secciones 2,4,6,7 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambio en un solo componente o server action
- Sin cambios de schema de base de datos
- Sin nuevas dependencias
- Limitado a 1-2 archivos
- Requisitos claros e inequívocos

**Ejemplos:**
- Actualizar estilos de un componente existente
- Corregir validación en un formulario
- Agregar campo a query existente
- Modificar server action existente

### TAREA ESTÁNDAR (Usa secciones 1-7 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Nuevo componente con server actions
- Cambios de schema de base de datos (Drizzle)
- Nuevos context providers
- 3-5 archivos afectados
- Integración de servicio externo

**Ejemplos:**
- Nueva página con data fetching y formulario
- Agregar tabla nueva con migración Drizzle
- Implementar nuevo context provider
- Integrar API externa con server actions

### TAREA COMPLEJA (Usa todas las secciones - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Nuevo módulo/feature completo (página + API + DB)
- Cambios en arquitectura de rutas
- Multiples migraciones de base de datos
- 6+ archivos afectados
- Cambios en sistema de autenticación

**Ejemplos:**
- Feature completo con CRUD, página y componentes
- Refactorizar sistema de rutas protegidas
- Implementar sistema de notificaciones en tiempo real

### TAREA CRÍTICA (Usa todas las secciones + plan de rollback obligatorio - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Migraciones en tablas de producción con datos
- Cambios en backend de autenticación
- Cambios de proveedor de base de datos
- Cambios que afectan disponibilidad del servicio

**Ejemplos:**
- Migrar schema con millones de filas
- Cambiar proveedor de auth (NextAuth → Clerk)
- Migrar de una base de datos a otra

---

## 0. Validación Pre-Vuelo (Específica de TypeScript)

DETENER. NO proceder si CUALQUIER validación falla. Resolver TODOS los fallos antes de continuar.

**0.0.1 — Disponibilidad de Herramientas:**
- [ ] Node.js instalado (20.0+ requerido para Next.js 16)
- [ ] Gestor de paquetes detectado (verificar `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, o `bun.lockb`)
- [ ] Herramientas de linting/type-checking disponibles (`eslint`, `tsc`)

**0.0.2 — Configuración del Entorno:**
- [ ] Módulos de Node instalados (`node_modules/` existe)
- [ ] Variables de entorno configuradas (`.env` o `.env.local` existe)
- [ ] Configuración de TypeScript presente (`tsconfig.json`)

**0.0.3 — Detección de Framework y Build Tool:**
- [ ] Versión de Node.js: X.Y.Z (debe ser 20.0+)
- [ ] Gestor de paquetes: npm / yarn / pnpm / bun (version X.X.X)
- [ ] Versión de Next.js: X.Y.Z (de `package.json`)
- [ ] Versión de React: X.Y.Z (de `package.json`)
- [ ] Build tool: Turbopack (por defecto en Next.js 16) / swc / webpack
- [ ] Versión de Next.js verificada: Si **16+**, confirmar que `middleware.ts` fue renombrado a `proxy.ts` y la función exportada es `proxy` (no `middleware`)
- [ ] Runtime target: Vercel / Netlify / AWS / Docker / Self-hosted

**0.0.4 — Validación de Nomenclatura:**
- [ ] Proyecto confirmado como TypeScript/Next.js (usar nomenclatura `XXX_camelCaseName.md`)
- [ ] Si no es TypeScript/Next.js, redirigir a la plantilla apropiada:
  - Proyectos Python: `task_template_python.md` (snake_case)
  - Proyectos Django: `task_template_django.md` (snake_case)
  - PHP/Web legacy: `task_template_php.md` (camelCase)
  - Google ADK: `task_template_adk.md` (UPPER_SNAKE_CASE)

---

### 0.0.6 — Triaje de Ingeniería (OBLIGATORIO para ESTÁNDAR+)

**Delta TypeScript/Next.js para T1 "Radio de impacto":**

- Unidad de análisis: **componentes, server actions, context providers, páginas, layouts, middleware**.
- Prerequisitos típicos: Next.js config, rutas, middleware, context providers necesarios.
- Integración: patrones de Server Actions, Context, data access establecidos.
- Decisiones stack-specific en T2: Server Action vs API Route · Context vs props · SSR vs CSR · Drizzle vs query directa.

**Tabla de complejidad (común a todos los stacks):**

| Radio | Complejidad |
|---|---|
| ≤2 archivos en 1 módulo | SIMPLE |
| 3-6 archivos en 1-2 módulos | ESTÁNDAR |
| 6+ archivos o 3+ módulos | COMPLEJA |
| Sistemas externos / datos producción / prerequisitos bloqueantes | CRÍTICA |

---

### Pasos 0.1–0.7 — Gestión del documento de tarea

**Delta TypeScript/Next.js:**

- **Paso 0.4 — Convención de nombres:** `XXX_camelCaseName.md` (camelCase JS/TS). Ubicación: `ai_docs/tasks/XXX_camelCaseName.md`.
- **Paso 0.5 — Verificación rápida antes de presentar:** ¿Se descubrió algo nuevo durante el análisis de Context Providers (Sección 1)? Si sí → comunicar como observación.
- **Paso 0.7 — Cabecera de seguimiento:** `Creado Por: task_template_typescript.md`.

---

## 1. Análisis de Context Providers Existentes (OBLIGATORIO)

PROTOCOLO OBLIGATORIO DE 5 PASOS — Analizar context providers existentes antes de planificar nuevo flujo de datos. NO proceder con diseño de componentes hasta completar.

**PASO 1: Descubrir Todos los Archivos Layout**

Identificar todos los archivos `layout.tsx` / `layout.js` en el directorio `app/`. Listar con rutas completas.

```
Layout files found: [count]
- [file path 1]
- [file path 2]
```

**PASO 2: Extraer Nombres de Providers de Cada Layout**

Leer cada archivo layout e identificar todos los componentes React Context Provider y sus props.

```markdown
| Layout File | Provider Components | Props Passed |
|-------------|-------------------|--------------|
| app/layout.tsx | ThemeProvider | theme={...} |
| app/(protected)/layout.tsx | UserProvider, UsageProvider | user={...}, usage={...} |
```

**PASO 3: Encontrar Archivos de Definición de Context**

Buscar archivos de context: `*/contexts/*.tsx`, `*/context/*.tsx`, `*Context.tsx`, o archivos que contengan `createContext`.

```
Context files found: [count]
- [file path with exported context name]
```

**PASO 4: Extraer Estructura de Datos del Context**

Para CADA archivo de context, documentar en este formato:
```typescript
// Context: UserContext
// File: contexts/UserContext.tsx
// Hook: useUser()
// Interface:
interface UserContextType {
  user: {
    id: string;
    email: string;
    name: string;
  };
  isLoading: boolean;
}
// Provided at: app/(protected)/layout.tsx
// Available in: All routes under /dashboard, /settings, /profile
```

**PASO 5: Crear Mapa de Disponibilidad de Context**

```markdown
## Mapa de Disponibilidad de Contexto

### Route: /dashboard/*
**Mounted Providers:**
- UserContext (useUser hook)
- UsageContext (useUsage hook)

**Available Data:**
```typescript
// From useUser():
user.id: string
user.email: string

// From useUsage():
subscription.tier: "free" | "pro" | "enterprise"
```

**Los componentes en esta ruta PUEDEN:**
- Acceder datos de usuario via `useUser()` — NO se necesitan props
- Acceder suscripción via `useUsage()` — NO se necesitan props
- NO deberían recibir user/subscription como props (ya estan en context)
```

**CHECKLIST DE FINALIZACIÓN** (Todos deben pasar antes de proceder):
- [ ] Paso 1: Todos los archivos layout descubiertos
- [ ] Paso 2: Todos los providers extraidos de layouts
- [ ] Paso 3: Todos los archivos de definición de context encontrados
- [ ] Paso 4: Todas las interfaces de context documentadas
- [ ] Paso 5: Mapa de disponibilidad de context creado
- [ ] Verificación: Sin suposiciones — todos los datos de lecturas reales de archivos

---

## 1B. Análisis de Alternativas de Implementación

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, documentar brevemente por que solo hay un enfoque viable.**

> Después de entender el estado actual (Context Providers, estructura existente), explorar MULTIPLES enfoques ANTES de comprometerse con uno. El objetivo es evitar descubrir mejores alternativas cuando ya se ha implementado la mitad.

### Criterio de Activación

Realizar análisis completo si se cumplen 2+ criterios:
- [ ] Multiples patrones de arquitectura viables (Server Actions vs API Routes, Context vs Props, etc.)
- [ ] Cambios que afectan 3+ archivos existentes
- [ ] Nueva funcionalidad sin precedente directo en el codebase
- [ ] Implicaciones de rendimiento o escalabilidad significativas
- [ ] Migraciones de base de datos involucradas

### Alternativas (Mínimo 2, idealmente 3)

**Alternativa 1: [Nombre descriptivo]**
- **Enfoque**: [Descripción breve — que patrón, que arquitectura]
- **Estructura**: [Archivos afectados, flujo de datos]
- **Pros**: [2-3 ventajas concretas]
- **Contras**: [2-3 desventajas concretas]
- **Complejidad**: Baja / Media / Alta
- **Riesgo**: [Que puede salir mal con este enfoque]

**Alternativa 2: [Nombre descriptivo]**
- [Misma estructura]

**Alternativa 3 (si aplica): [Nombre descriptivo]**
- [Misma estructura]

### Matriz de Compromisos

| Factor | Alt 1 | Alt 2 | Alt 3 | Ganador |
|--------|-------|-------|-------|---------|
| **Complejidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Rendimiento** | B/M/A | B/M/A | B/M/A | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Escalabilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Consistencia con codebase** | B/M/A | B/M/A | B/M/A | [ ] |

### Decisión y Justificación

**Seleccionado**: Alternativa [X] — [Nombre]

**Justificación**:
1. **Razón Principal**: [Por que es la mejor opción para ESTE proyecto]
2. **Compromiso Aceptado**: [Que se sacrifica y por que es aceptable]

**Alternativas Rechazadas**:
- Alternativa [Y]: Rechazada porque [razón concreta, no "es peor"]

### DECISIÓN DEL USUARIO REQUERIDA

Presentar las alternativas al usuario con la recomendación. **Esperar aprobación antes de proceder con las secciones de implementación.**

---

## 1C. Casos límite mínimos y modos de falla (obligatorio)

**OBLIGATORIO para todas las complejidades (SIMPLE, ESTÁNDAR, COMPLEJA, CRÍTICA).** La sección debe tener ≥3 entradas concretas con respuesta esperada. plan-checker D8 BLOQUEA si artifact ejecutable nuevo sin la sección o <3 entradas concretas.

### Las 3 preguntas mínimas (responder concretamente)

- **Input vacío / null / no existente:** ¿Qué pasa si formularios vacíos, props undefined, params null, o queries con resultados vacíos?
  **Respuesta esperada:** _[validación con Zod, error tipado, fallback UI]_
- **Fallo de dependencia externa:** ¿Qué pasa si fetch falla, server action timeouts, o DB query falla?
  **Respuesta esperada:** _[error boundary, retry, optimistic UI con rollback]_
- **Estado tras error parcial:** ¿Qué pasa si una mutation falla a mitad? ¿Hay revalidation / rollback / hidratación inconsistente?
  **Respuesta esperada:** _[transacción Drizzle, revalidatePath, error recovery]_

Para preguntas adicionales por tipo de artifact, ver **`references/edge-cases-catalog.md`**.

> Antes de disenar la implementación, analizar sistematicamente que puede salir mal. Los edge cases descubiertos aqui deben informar el diseño, no solo validarse en testing.

### Escenarios de Falla

| Componente/Flujo | Escenario de Falla | Impacto | Probabilidad | Mitigación |
|-------------------|-------------------|---------|--------------|------------|
| [Server Action X] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Componente Y] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Query Z] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |

### Preguntas Obligatorias de Edge Cases

- [ ] **Inputs vacíos/nulos**: Que pasa si el usuario envia formularios vacíos, campos nulos, strings vacíos?
- [ ] **Escala**: Que pasa con 10x el volumen actual de datos? Las queries son eficientes con tablas grandes?
- [ ] **Concurrencia**: Que pasa si dos usuarios modifican el mismo recurso simultáneamente?
- [ ] **Dependencias externas**: Que pasa si la base de datos esta lenta, un servicio externo no responde, o una API falla?
- [ ] **Estado inconsistente**: Que pasa si una operación multi-paso falla a la mitad? Hay rollback?
- [ ] **Límites server/client**: Algún componente podría importar accidentalmente módulos server-only?
- [ ] **Hidratación**: Algún componente podría mostrar contenido diferente en servidor vs cliente?
- [ ] **Seguridad**: Se validan inputs en el servidor (no solo en el cliente)? Se verifican permisos?

### Fallas Críticas (Alto Impacto + Alta Probabilidad)
- [Listar las que requieren mitigación obligatoria en el diseño]

### Riesgos Aceptados (Bajo Impacto o Baja Probabilidad)
- [Listar las que se decide no manejar, con justificación]

---

## 1D. Estrategia de Rollback (OBLIGATORIO para COMPLEJA/CRÍTICA)

Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:

### Si el cambio de código rompe funcionalidad:
1. `git revert <commit_hash>`
2. Verificar que build y type-check pasan
3. Re-desplegar version anterior

### Si la migración de base de datos falla:
1. Ejecutar down migration: seguir `drizzle-migration-rollback`
2. Verificar integridad de datos
3. Restaurar desde backup si no hay down migration

### Si server actions o API routes fallan:
1. Revertir cambios en archivos afectados
2. Verificar que rutas existentes responden correctamente
3. Limpiar cache de Next.js si es necesario

**Documentar:**
- **Disparadores de rollback:** [Que condiciones activan el rollback]
- **Tiempo estimado de rollback:** [Minutos/horas]
- **Datos en riesgo:** [Que datos podrían perderse]
- **Verificación post-rollback:** [Como confirmar éxito]

---

## 2. Datos y Cambios de Base de Datos

### Cambios de Schema de Base de Datos
```sql
-- Creación de nuevas tablas, sentencias DDL, migraciones, indices
```

### Actualizaciones de Modelo de Datos
```typescript
// Nuevos tipos o actualizaciones de schema
// Al definir schemas de Drizzle, considerar agregar indices para columnas consultadas frecuentemente
```

### Plan de Migración de Datos
- [ ] [Paso de migración 1]
- [ ] [Paso de migración 2]
- [ ] [Pasos de validación de datos]

### OBLIGATORIO: Protocolo de Seguridad de Down Migration
Antes de ejecutar CUALQUIER migración de base de datos, crear la down migration correspondiente:

- [ ] Paso 1: Generar Migración — `npm run db:generate`
- [ ] Paso 2: Crear Down Migration — Seguir plantilla `drizzle-migration-rollback`
- [ ] Paso 3: Crear subdirectorio `drizzle/migrations/[timestamp_name]/`
- [ ] Paso 4: Generar `down.sql` con operaciones de rollback seguras
- [ ] Paso 5: Verificar que todas las operaciones usen `IF EXISTS` e incluyan advertencias
- [ ] Paso 6: Solo después de crear la down migration, ejecutar `npm run db:migrate`

ADVERTENCIA: NUNCA ejecutar `npm run db:migrate` sin crear primero el archivo de down migration.

---

## 3. Cambios de API y Backend

### Patrón de Acceso a Datos — Reglas de Arquitectura

Seguir estas reglas estrictamente:

#### MUTATIONS (Server Actions) -> `app/actions/[feature].ts`
- Archivo de Server Actions — SOLO mutations (create, update, delete)
- Debe usar directiva `'use server'` y `revalidatePath()` después de mutations

#### QUERIES (Data Fetching) -> Elegir según complejidad:

**Queries Simples** -> Directamente en Server Components
- Llamadas directas `await db.select().from(table)`
- Usar cuando: Tabla única, clausula WHERE simple, usado en solo 1-2 lugares

**Queries Complejas** -> `lib/[feature].ts`
- Funciones de consulta para JOINs, agregaciones, lógica compleja, usado en 3+ lugares

#### API Routes -> `app/api/[endpoint]/route.ts` — RARAMENTE NECESARIO
Solo crear API routes para:
- Webhooks (callbacks de servicios de terceros)
- Respuestas no-HTML (descargas de archivos, exportaciones XML/CSV)
- Proxies de API Externa (ocultar API keys del cliente)
- APIs Públicas (para consumo externo)

NO usar API routes para data fetching interno, envío de formularios o flujos de autenticación.

#### Diagrama de Decisión — "Donde debería ir este código?"

```
Modifying data? (POST/PUT/DELETE)
  -> Server Actions: `app/actions/[feature].ts`

Fetching data? (GET operations)
  Simple query (1 table, basic WHERE)?
    -> Direct in Server Component
  Complex query (JOINs, reused, business logic)?
    -> lib function: `lib/[feature].ts`

External integration?
  Webhook from 3rd party?
    -> API Route: `app/api/webhooks/[service]/route.ts`
  File download/export?
    -> API Route: `app/api/export/[type]/route.ts`
  Internal app feature?
    -> NO API ROUTE. Use Server Actions or lib/ instead
```

### Modelo de Caching (Next.js 16+)

**`"use cache"` directive:** Nuevo modelo de caching opt-in. Los componentes NO se cachean por defecto — usar `"use cache"` explícitamente donde se necesite.

**Capas de cache (referencia):**
- Request memoization → Data cache → Full route cache (static/PPR) → Router cache

### Server Actions
- [ ] **`create[Model]`** — [Descripción]
- [ ] **`update[Model]`** — [Descripción]
- [ ] **`delete[Model]`** — [Descripción]

### Consultas de Base de Datos
- [ ] **Directamente en Server Components** — Solo queries simples
- [ ] **Funciones de Consulta en lib/** — Queries complejas

### API Routes (Solo para Casos Especiales)
- [ ] **Webhooks** — Callbacks de terceros
- [ ] **Respuestas no-HTML** — Descargas de archivos, exportaciones
- [ ] **Proxies de API Externa** — Ocultación de API keys

### Integraciones Externas
- [Servicio 1: Propósito y configuración]
- [Servicio 2: API keys y configuración requerida]

NOTA: Al usar modelos Gemini, siempre usar **gemini-2.5-flash**. Al usar modelos OpenAI, usar **gpt-4o**.

---

## 4. Cambios de Frontend

### Nuevos Componentes
- [ ] **`components/[feature]/ComponentName.tsx`** — [Propósito y props]
- [ ] **`components/[feature]/AnotherComponent.tsx`** — [Funcionalidad]

**Organización de Componentes:**
- Directorios `components/[feature]/` para componentes específicos de funcionalidad
- `components/ui/` para componentes compartidos/reutilizables (patrón existente)

### Actualizaciones de Páginas
- [ ] **`/path/to/page`** — [Que cambios se necesitan]
- [ ] **`/another/page`** — [Modificaciones requeridas]

### Gestión de Estado
- [Context providers, estado global, decisiones de estado local]
- [Estrategias de data fetching]

### CRÍTICO: Estrategia de Uso de Context

Antes de crear cualquier prop de componente o planificar data fetching, verificar disponibilidad de context existente.

**Patrón de composición Server/Client:**
- Mantener componentes server-side por defecto — empujar `'use client'` lo más abajo posible en el árbol
- Usar children prop para composición: datos de servidor dentro de componentes client interactivos
- Extraer lógica de negocio de Server Actions a funciones puras en `lib/services/`

#### Patrón de Diseño Context-First
- [ ] Verificar contexts disponibles antes de definir props de componentes
- [ ] Usar context hooks en lugar de props cuando los datos estan disponibles via context
- [ ] Evitar prop drilling cuando context esta disponible
- [ ] No duplicar data fetching cuando el padre ya tiene los datos

#### Diagrama de Decisión — "Debería ser un prop o usar context?"
```
Is component rendered inside a provider that has this data?
  YES: Use context hook (useUser, useUsage, etc.) — NO PROPS NEEDED
  NO: Check if parent could provide context or if prop is necessary

Is this data already fetched by parent layout/component?
  YES: Use context or pass via props (prefer context)
  NO: Component may need to fetch data directly

Is this data specific to this component only?
  YES: Local data fetching or props appropriate
  NO: Consider expanding context or using higher-level data source
```

#### Anti-Patrones Comunes a Evitar
```typescript
// BAD: Component inside UserProvider but receives user data as props
interface ProfileProps {
 user: UserData; // Already in UserContext!
}

// GOOD: Component uses context directly
function ProfileComponent() {
 const user = useUser();
 const { subscription } = useUsage();
 return <div>{user.email}</div>;
}

// BAD: Duplicate data fetching in protected route
async function ProtectedPage() {
 const user = await getCurrentUser(); // Layout already authenticated!
}

// GOOD: Use layout's authentication and context
function ProtectedPage() {
 const user = useUser(); // From layout's UserProvider
}
```

#### Checklist de Análisis de Context
- [ ] Escanear directorio `contexts/` para todos los context providers disponibles
- [ ] Mapear jerarquia de providers desde layouts hasta componentes
- [ ] Verificar prop drilling donde context hooks podrían usarse
- [ ] Verificar que no hay data fetching duplicado cuando context ya provee los datos
- [ ] Revisar patrones de rutas protegidas para evitar re-autenticación

---

## 5. Estructura de Archivos y Organización

### Archivos Nuevos a Crear
```
project-root/
  app/[route]/
    page.tsx           # UI principal de la ruta
    loading.tsx        # UI de estado de carga
    error.tsx          # Error boundary específico de ruta
  components/[feature]/
    FeatureComponent.tsx
  app/actions/
    [feature].ts       # Server actions (solo mutations)
  lib/
    [feature].ts       # Funciones de consulta complejas
    utility.ts         # Utilidades compartidas
```

**Reglas de Organización de Archivos:**
- Componentes: Siempre en directorios `components/[feature]/`
- Páginas: Solo `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` en rutas de `app/`
- Server Actions: En `app/actions/[feature].ts` (solo mutations)
- Queries Complejas: En `lib/[feature].ts`
- Tipos: Co-ubicados con componentes o en `lib/types.ts`

#### SEPARACIÓN SERVER/CLIENT EN ARCHIVOS LIB

CRÍTICO: Nunca mezclar imports server-only con utilidades client-safe en el mismo archivo.

**Imports Server-Only (No pueden ser usados por componentes client):**
- `next/headers` (cookies, headers)
- `@/lib/supabase/server`
- `@/lib/drizzle/db` (operaciones de base de datos)
- Módulos de Node.js (fs, path, etc.)

**Diagrama de Decisión:**
```
Server-only imports + Client-safe utilities in same file?
  -> SPLIT: Create lib/[feature]-client.ts for client utilities

Only server-side operations?
  -> KEEP: Single lib/[feature].ts file

Only client-safe utilities?
  -> KEEP: Single lib/[feature].ts file
```

### Archivos a Modificar
- [ ] **`existing/file.ts`** — [Que cambios realizar]
- [ ] **`another/file.tsx`** — [Modificaciones necesarias]

### Dependencias a Agregar
```json
{
  "dependencies": {
    "new-package": "^1.0.0"
  },
  "devDependencies": {
    "dev-package": "^2.0.0"
  }
}
```

---

## 6. Plan de Implementación — Requisitos Específicos de TypeScript

### Requisitos Específicos por Fase
- [ ] Para cambios de base de datos, crear down migration ANTES de ejecutar `npm run db:migrate`
- [ ] Para nuevas rutas de página, crear `loading.tsx` y `error.tsx` junto a `page.tsx`
- [ ] Crear componentes en directorios `components/[feature]/`
- [ ] Seguimiento de finalización de tareas en tiempo real después de cada subtarea
- [ ] Ejecutar linting en cada archivo modificado (solo análisis estático)

### Verificación de Arquitectura de Archivos Lib (Para cualquier cambio en lib/)
- [ ] Auditar nuevos archivos lib por mezcla server/client
- [ ] Verificar cadenas de import por dependencias de servidor
- [ ] Dividir archivos si es necesario usando patrón `[feature]-client.ts`

---

## 7. Estándares de Calidad de Código (TypeScript)

### Reglas de Ejecución de Comandos

COMANDOS PROHIBIDOS (Conflictaran con servidor de desarrollo en ejecución):
- `npm run dev` / `npm start` / `next dev`
- `npm run build` / `next build`
- Cualquier comando que inicie/sirva/construya la aplicación

COMANDOS PERMITIDOS (Solo análisis estático seguro):
- `npm run lint` — Análisis estático de código
- `npm run type-check` / `tsc --noEmit` — Solo verificación de tipos
- Comandos de base de datos (cuando sea necesario): `npm run db:generate`, `npm run db:migrate`
- Herramientas de lectura/análisis de archivos

### Regla Específica del Proyecto

**OBLIGATORIO:** Crear archivos de down migration antes de ejecutar CUALQUIER migración de base de datos.

### Cumplimiento de Arquitectura
- [ ] VERIFICAR: Mutations -> Server Actions (`app/actions/[feature].ts`)
- [ ] VERIFICAR: Queries -> funciones lib para complejas, directas en componentes para simples
- [ ] VERIFICAR: API routes solo para webhooks, exportaciones de archivos, integraciones externas
- [ ] VERIFICAR: Sin violaciones de límites server/client en archivos lib
- [ ] VERIFICAR: Componentes usan context providers en lugar de props innecesarios
- [ ] VERIFICAR: Sin data fetching duplicado cuando context ya provee los datos
- [ ] DOBLE VERIFICACIÓN: Esto realmente necesita un API route o debería ser un Server Action/función lib?
- [ ] DOBLE VERIFICACIÓN: Pueden los componentes client importar de forma segura de todos los archivos lib que necesitan?

### Checklist de Revisión TypeScript (TODOS obligatorios)

1. **Requisitos** — Mapear cada criterio de éxito a su implementación (archivo:línea). Si alguno NO CUMPLIDO → DETENER.
2. **Linting y tipos** — `npm run lint` + `npm run type-check`. 0 NUEVOS errores introducidos por los cambios (errores preexistentes fuera de alcance).
3. **Code smells** — Buscar EN ARCHIVOS MODIFICADOS: TODO/FIXME, console.log, código comentado, imports no usados. Reportar hallazgos; NO eliminar sin confirmación del usuario.
4. **DRY/KISS/SoC: responsabilidad del `reviewer` agent §2/§3/§5 post-impl.** El implementer respeta P2 + P3 sin aplicar refactor proactivo. Server Actions para mutations, lib/ para queries complejas, componentes solo presentación — el reviewer correlacionado verifica adherencia post-impl.
7. **Seguridad** — Validación de inputs server-side, sin secretos en client, permisos verificados.
8. **Integración** — Listar importers de módulos modificados (todos los que existan, sin mínimo artificial) → verificar cada uno. Sin dependencias circulares (`npx madge --circular` si disponible).
9. **Regresión** — Ejecutar `npm test` completo. Si no hay tests → documentar como riesgo.
10. **Arquitectura TypeScript:**
    - [ ] Patrones de Acceso a Datos (Server Actions, queries lib, API routes)
    - [ ] Límites Server/Client (sin mezcla en lib/)
    - [ ] Uso de Context (hooks vs. props innecesarios)
    - [ ] Organización de Componentes (directorios `components/[feature]/`)
    - [ ] Seguridad de Migración de BD (down migration antes de `npm run db:migrate`)

**Baseline de deuda técnica (ESTÁNDAR+):** Registrar al inicio: errores lint, errores type-check. Repetir al final. El cambio no debe empeorar métricas significativamente: lint/tipos (+0 nuevos), coverage (tolerancia -2%). Métricas preexistentes fuera de alcance.

**Veredicto:** APROBADO (0 problemas) / CONDICIONAL (problemas menores) / RECHAZADO (problemas críticos → REPORTAR al usuario con propuesta de corrección; NO corregir automáticamente sin aprobación)

---

## 8. Problemas de Límites Server/Client

NUNCA:
- Importar desde `next/headers` en archivos que exportan utilidades client-safe
- Mezclar operaciones de base de datos con funciones de utilidad en el mismo archivo
- Crear archivos de utilidad que tanto server como client importan sin considerar la cadena de imports

SIEMPRE:
- Separar operaciones de servidor de utilidades de cliente en archivos diferentes
- Usar sufijo `-client.ts` para archivos de utilidad client-safe
- Probar que componentes client pueden importar utilidades sin errores

---

## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

**Delta TypeScript/Next.js:**
- Añadir checkbox: `[ ] Context providers analizados (Sección 1)` — específico TS por el protocolo de 5 pasos del análisis de Context.

---

## Instrucciones para el Agente de IA

Ver sección canónica en `task_template.md` §"Instrucciones canónicas para el Agente de IA". Deltas específicos de TypeScript/Next.js:

- **Triaje App Router:** distinguir Client Component (`"use client"`) vs Server Component antes de planificar; impacto en bundle size y hydration difiere.
- **Tipos estrictos:** verificar en Checklist que el cambio no introduce `any` implícito; `tsc --noEmit` limpio.
- **Pre-flight:** verificar Node.js, versión de Next.js, y Context Providers activos en `_app` / `layout.tsx`.

---

## Acciones Prohibidas y Documento Único

---

## Bloque `contract:` (opcional)


---

| Stack | Skill Recomendada |
|-------|-------------------|
| TypeScript/Next.js | `cleanup` + `reviewer` |
