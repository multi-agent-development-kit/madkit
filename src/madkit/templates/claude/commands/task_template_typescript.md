# Plantilla de Tarea de IA para TypeScript/Next.js

> Esta plantilla crea documentos de tareas para desarrollo TypeScript/Next.js con IA. Referencia el protocolo genérico de `task_template.md` y agrega análisis, patrones y validación específicos de TypeScript.
>
> **Cabecera de Metadatos opcional (T079):** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Ver documentación completa en [`task_template.md`](task_template.md) §"Cabecera de Metadatos del Task Doc (opcional)" — esta plantilla hereda esa especificación.

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

<!-- SHARED-BLOCK: protocolo-creacion-v1 -->
### Paso 0.1: Verificar Estructura del Proyecto

Confirmar que la estructura de documentación requerida existe.

- Verificar que el directorio `ai_docs/` existe
- Verificar que el subdirectorio `ai_docs/tasks/` existe

**Si no se encuentra:** DETENER y preguntar al usuario: "No veo un directorio `ai_docs/`. ¿Debería crearlo?"

---

### Paso 0.2: Verificar Documento de Tarea Activa

**Antes de crear una nueva tarea, verificar si ya existe una para este trabajo:**

1. Listar archivos en `ai_docs/tasks/` y buscar un documento relacionado con la solicitud actual
2. Si el usuario pide correcciones/revisiones de trabajo anterior → encontrar y ACTUALIZAR ese documento
3. Si el usuario pide continuar implementación → encontrar y ACTUALIZAR ese documento
4. **Solo crear un nuevo número de tarea si es trabajo genuinamente NUEVO sin documento existente**

**Si se encuentra tarea activa:** Saltar al Paso 0.5 y trabajar sobre el documento existente.

---

### Paso 0.3: Detectar Siguiente Número de Tarea

**Solo si el Paso 0.2 confirmó que no aplica ninguna tarea existente:**

1. Listar archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de CADA nombre de archivo
3. Encontrar el número mas alto entre TODOS los archivos
4. Sumar 1 y formatear con 3 dígitos
5. Si no existen archivos: usar 001

**Reglas:** Secuencia global compartida, siempre 3 dígitos, cada número se usa EXACTAMENTE UNA VEZ.
- ❌ El número `000` está RESERVADO para calibración del proyecto — nunca usar para tareas normales

---

### Paso 0.4: Crear Documento de Tarea

**CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo. Sin excepciones.**

**Convención de Nombres para TypeScript/Next.js:**
- **Formato:** `XXX_camelCaseName.md`
- **Convención:** camelCase (JavaScript/TypeScript)
- **Ubicación:** `ai_docs/tasks/XXX_camelCaseName.md`
- **Verificar:** NO exista un archivo con ese prefijo de número

---

### Paso 0.5: Presentar Documento de Tarea al Usuario

**NOTA:** El análisis crítico de impacto, prerequisitos y alcance ya se realizó en el Triaje de Ingeniería (Paso 0.0.6). Aquí se presenta el documento ya validado.

**Verificación rápida antes de presentar:**
- ¿El documento refleja el alcance validado en T3? Si no → actualizar.
- ¿Se descubrió algo nuevo durante el análisis de Context Providers? Si sí → comunicar como observación.

Presentar al usuario:

```
Documento de Tarea Creado: `ai_docs/tasks/XXX_camelCaseName.md`

Resumen del Enfoque Planificado:
[Resumen breve de 2-3 oraciones]

[Solo si se descubrió algo nuevo:]
Observaciones Adicionales:
- **[Categoría]:** [Observación concreta]

¿Cómo deseas proceder?

A) Vista Previa de Cambios de Código Detallados
B) Aprobar e Iniciar Implementación
C) Modificar o Iterar sobre el Plan
```

PUNTO DE ESPERA OBLIGATORIO: DETENERSE y esperar elección explícita del usuario.

**NOTA SOBRE ITERACIÓN:** La iteración es el proceso normal. Si el usuario elige C, actualizar el documento existente, incorporar el feedback, y re-presentar.

---

### Paso 0.6: Manejar Retroalimentación del Usuario

**Si el usuario elige Opción C (Modificar) o solicita cambios:**
- Actualizar el documento de tarea EXISTENTE — NO crear nuevos archivos
- NO crear nuevas versiones (`_v2`, `_updated`, etc.)

---

### Paso 0.7: Actualizaciones de Fase de Implementación

**Cuando el usuario aprueba (Opción B) y la implementación comienza:**
- Documentar progreso en el documento de tarea EXISTENTE agregando/actualizando una sección `## Progreso`
- NO modificar plantillas en `.claude/commands/`

#### Regla de Alcance Estricto (ACTIVA durante toda la implementación)

> OBLIGATORIO: Solo modificar código directamente relacionado con la sección "Incluye".

- Si se descubre un problema FUERA del alcance:
  1. **NO arreglarlo** — documentarlo como nota en "Descubrimientos fuera de alcance" del task document
  2. Si es BLOQUEANTE para la tarea actual: PAUSAR, informar al usuario, esperar decisión
  3. Si NO es bloqueante: ignorarlo completamente
- **Test rápido:** ¿Este cambio está en "Incluye"? → SI: proceder. NO: no tocarlo.
- **Excepción única:** errores de sintaxis/compilación en líneas que YA se están modificando
- **Prohibido:** arreglar warnings, code smells, o deuda técnica encontrada "de paso"

**Agregar sección de seguimiento:**
```markdown
## Seguimiento del Ciclo de Vida de Tarea

### Creación
- **Creado:** [timestamp]
- **Creado Por:** task_template_typescript.md
- **Número de Tarea:** [XXX]
- **Complejidad Inicial:** [Simple | Estándar | Compleja | Crítica]

### Revisiones
- [Fecha]: [Que cambio y por que]

### Progreso de Implementación / Estado de Finalización
- **Estado:** [Planificación | En Progreso | Pending Review | Completado | Bloqueado]
- **Última Actualización:** [timestamp]
```

<!-- /SHARED-BLOCK -->

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

<!-- AI Agent: Para tareas SIMPLE (<=2 archivos), el triaje es mental — verificar rápidamente y pasar al Paso 0.1. Para ESTÁNDAR+, es conversación explícita con el usuario. -->

**T1: Analizar** — Examinar el codebase para responder:

- **Radio de impacto:** ¿Cuántos componentes, server actions, context providers, páginas se ven afectados?
  - <=2 archivos en 1 módulo → SIMPLE
  - 3-6 archivos en 1-2 módulos → ESTÁNDAR
  - 6+ archivos o 3+ módulos → COMPLEJA
  - Sistemas externos, datos de producción, prerequisitos bloqueantes → CRÍTICA
- **Prerequisitos:** ¿Qué debe existir? Next.js config, rutas, middleware, context providers necesarios. Trazar dependencias (max 2 niveles). ✅ existe | ❌ falta.
- **Integración:** ¿Hay patrones de Server Actions, Context, data access establecidos que seguir?
- **Stack-specific:** ¿Server Action o API Route? ¿Context o props? ¿SSR o CSR? Verificar antes de planificar.

**T2: Cuestionar (solo si hay razón):**

- Alcance cubre 2+ funcionalidades independientes → proponer desglose
- Existe solución más simple (Server Action vs API Route, Context existente vs nuevo) → proponerla
- Prerequisitos bloqueantes (tablas, context providers, middleware) → proponer tareas separadas
- Sobre-diseño detectado → proponer simplificación (KISS)

**T3: Alinear** — Para ESTÁNDAR+, presentar al usuario:

```
Alcance: [1-2 frases]
Complejidad: [nivel] — [N archivos, M módulos]
Prerequisitos: [lista si hay] / Ninguno detectado
¿Confirmas este alcance para crear el documento de tarea?
```

**PUNTO DE ESPERA:** Para ESTÁNDAR+, esperar confirmación antes de proceder.

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

<!-- SHARED-BLOCK: alternativas-v1 -->
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

<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: edge-cases-v1 -->
## 1C. Análisis de Modos de Falla y Casos Extremos

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, omitir esta sección.**

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

<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: rollback-v1 -->
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

<!-- /SHARED-BLOCK -->

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
4. **DRY** — En archivos modificados, verificar que no se duplica lógica ya existente en el codebase. Si se encuentra duplicación → reportar al usuario con propuesta de extracción; NO extraer automáticamente.
5. **KISS** — ¿Es la implementación más simple posible? No crear abstracciones para un solo uso.
6. **Separación de responsabilidades** — Server Actions para mutations, lib/ para queries complejas, componentes solo presentación. Sin lógica de negocio en componentes.
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

<!-- SHARED-BLOCK: puerta-pre-impl-v1 -->
## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario (ESTÁNDAR+)
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Complejidad clasificada (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA)
- [ ] Pre-flight completado sin errores
- [ ] Context providers analizados (Sección 1)
- [ ] Archivos afectados identificados
- [ ] Alternativas evaluadas (ESTÁNDAR+)
- [ ] Casos extremos analizados (ESTÁNDAR+)
- [ ] Rollback documentado (COMPLEJA/CRÍTICA)
- [ ] Criterios de éxito medibles definidos
- [ ] Documento presentado y aprobado por usuario

→ Si CUALQUIER checkbox sin marcar: DETENER. No implementar.

<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: instrucciones-agente-v3 -->
## Instrucciones para el Agente de IA

**Rol: Ingeniero de Software Senior, no documentador.**

El asistente NO acepta la petición del usuario sin análisis. ANTES de crear cualquier documento de tarea, ejecutar el Triaje de Ingeniería (Paso 0.0.6): analizar impacto, trazar prerequisitos, evaluar alcance.

### Disciplina de Alcance (OBLIGATORIO)

> Complementa la "Regla de Alcance Estricto" del Paso 0.6 con principios de decisión.

- **Decisiones intencionales:** Asumir que código existente fuera del alcance refleja decisiones de negocio válidas. No sugerir cambios a código funcional que no está en el scope.
- **Auto-remediación prohibida:** Nunca corregir problemas descubiertos durante review sin confirmación explícita del usuario. Reportar → esperar → actuar.

### Señales de Alerta (DETENER y comunicar al usuario)

- Petición que cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas
- Prerequisitos bloqueantes que son tareas en sí mismos → proponer crearlos primero
- Existe solución más simple en el codebase o framework → proponerla
- Radio de impacto sugiere complejidad diferente a la intuida → advertir y re-clasificar
- Se pide crear complejidad innecesaria → proponer simplificación (KISS)

### Flujo de Trabajo

1. **Triaje** — Analizar impacto, prerequisitos, alcance (Paso 0.0.6 — T1/T2/T3)
2. **Alinear** — Presentar alcance al usuario, esperar confirmación (ESTÁNDAR+)
3. **Pre-flight** — Verificar entorno TypeScript (Node.js, framework, Context Providers)
4. **Documentar** — Crear documento de tarea con alcance validado
5. **Presentar** — Opciones A/B/C
6. **Implementar** — Solo tras aprobación explícita (opción B)

### Opciones de Implementación (presentar siempre)

**A)** Vista Previa de Cambios de Código — fragmentos antes/después
**B)** Proceder con Implementación — fase por fase
**C)** Modificar o Iterar sobre el Plan — ajustar antes de comprometerse

Esperar elección explícita. NUNCA asumir aprobación.

### Durante Implementación

Por cada fase completada:
- Actualizar checkbox del documento de tarea: `[x]` + timestamp + archivos modificados + resultado de verificación (lint/types)
- Si se descubre que el alcance era incorrecto → DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` → ejecutar checklist de revisión → si APROBADO cambiar a `Completado`.

### Aprobación Explícita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" → confirmar antes de proceder
<!-- /SHARED-BLOCK -->

---

| Stack | Skill Recomendada |
|-------|-------------------|
| TypeScript/Next.js | `cleanup` + `reviewer` |
