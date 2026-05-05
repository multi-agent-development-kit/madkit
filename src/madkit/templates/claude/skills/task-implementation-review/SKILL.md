---
name: task-implementation-review
description: "Verificación de requisitos contra tarea. Activar después de reviewer o antes de marcar tarea como COMPLETADA — valida implementación contra ai_docs/tasks/ punto por punto. NO es revisión de código (→ reviewer)."
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

---

## 1. Type Safety (TypeScript)

```typescript
// Mal: tipo implicito, assertion sin validacion
async function getUser(id: string) { ... }
const user = data as User;

// Bien: tipo explicito, type guard
async function getUser(id: string): Promise<User | undefined> { ... }
if (isUser(data)) { const user = data; }
```

- Sin `any` explicitos o implicitos
- Todas las funciones con tipos de retorno explicitos
- Sin assertions injustificadas — validar con type guards

## 2. Type Safety (Python)

```python
# Mal
from typing import Any, Dict, Optional
def process(data: Any) -> Optional[Dict[str, str]]: ...

# Bien (Python 3.10+)
def process(data: dict[str, str]) -> dict[str, str] | None: ...
```

- Sin `Any`, todas las funciones con anotacion de retorno (incluyendo `-> None`)
- Sintaxis moderna: `dict` no `Dict`, `str | None` no `Optional[str]`

## 3. ADK

```python
# Mal
agent = Agent(name="my-agent")
api_key = os.getenv("GOOGLE_API_KEY")

# Bien
from config import settings
root_agent = Agent(name="my-agent", model="gemini-2.0-flash", output_key="result")
```

- Exportar como `root_agent` con `output_key`
- Config centralizada sobre `os.getenv()` directo

## 4. Drizzle ORM

```typescript
// Mal
where: sql`user_id = ${userId}`;
const rows = await db.select().from(usersTable);

// Bien
import { eq } from 'drizzle-orm';
where: eq(users.id, userId);
const rows = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable);
```

- Operadores type-safe sobre SQL raw
- Transacciones para operaciones atomicas multi-paso
- Seleccionar solo columnas necesarias

## 5. Next.js

### Async Params (Next.js 15+)
```typescript
// Server Component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
// Client Component
'use client';
import { use } from 'react';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

### revalidatePath — GOTCHA
```typescript
revalidatePath('/dashboard');              // Estatica — tipo opcional
revalidatePath('/items/[id]', 'page');     // Dinamica — DEBE incluir tipo
```

- Sin client components async — usar `useEffect` + `useState`

## 6. Separacion Server/Client

```
lib/
  storage-client.ts    # Client-safe (constantes, tipos, funciones puras)
  storage.ts           # Server-only (puede re-exportar de -client)
```

Imports server-only (nunca en cliente): `@/lib/supabase/server`, `@/lib/drizzle`, `next/headers`.

## 7. Seguridad

```typescript
// Auth
const { user, error } = await authenticateRequest();
if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

// Validacion
const result = InputSchema.safeParse(body);
if (!result.success) return Response.json({ error: result.error.issues }, { status: 400 });

// Errores de DB
try {
  await db.insert(records).values(data);
} catch (error) {
  if (error.code === '23505') return Response.json({ error: 'Already exists' }, { status: 409 });
  console.error('Database error:', error);
  return Response.json({ error: 'Database error' }, { status: 500 });
}
```

- Sin secrets en codigo cliente (solo `NEXT_PUBLIC_*`)
- Toda entrada de usuario validada (Zod)

## 8. Server Actions

```typescript
'use server';
type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function createRecord(data: Input): Promise<ActionResult<{ id: string }>> {
  const { user, error } = await authenticateRequest();
  if (error || !user) return { success: false, error: 'Unauthorized' };
  // ... accion
  revalidatePath('/items', 'page');
  return { success: true, data: { id: record.id } };
}
```

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
