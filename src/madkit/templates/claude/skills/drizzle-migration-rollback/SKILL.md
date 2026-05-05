---
name: drizzle-migration-rollback
description: "Guía Drizzle ORM, migraciones y rollbacks. Activar proactivamente al editar archivos schema.ts/drizzle.config.ts, crear migraciones, o modificar tablas/columnas/relaciones en proyectos con drizzle-orm en deps."
---

# Drizzle ORM: Migraciones, Rollback y Codificación

> Guía operativa para Drizzle ORM (v1.0 beta) — operadores type-safe, migraciones seguras, rollbacks y patrones de schema.

---

## Detección de Proyecto

| Indicador | Stack | Acción |
|-----------|-------|--------|
| `pyproject.toml`, archivos `.py` | Python | Usar cleanup-python |
| `package.json`, `tsconfig.json`, `drizzle.config.ts` | Drizzle/TypeScript | Esta skill |

---

## Scripts de Package.json (OBLIGATORIO)

**Nunca uses `npx drizzle-kit` directamente** — evitan la carga de variables de entorno.

| ❌ Comando directo | ✅ Script npm |
|-------------------|--------------|
| `npx drizzle-kit generate` | `npm run db:generate` |
| `npx drizzle-kit studio` | `npm run db:studio` |
| Scripts de migración directos | `npm run db:migrate` |

Scripts disponibles: `db:generate`, `db:migrate`, `db:rollback`, `db:studio`, `db:seed`, `db:check`.
Los scripts aseguran carga de `.env.local` mediante `dotenv-cli`.

**Migration check (v1.0):** Ejecutar `npm run db:check` antes de aplicar migraciones para detectar conflictos entre el schema actual y las migraciones pendientes.

---

## Operadores Drizzle sobre Raw SQL

**Siempre** usa operadores type-safe de Drizzle en lugar de template `sql`:

| ❌ Raw SQL | ✅ Operador Drizzle |
|-----------|-------------------|
| `` sql`${col} = ANY(${arr})` `` | `inArray(col, arr)` |
| `` sql`${col} = ${val}` `` | `eq(col, val)` |
| `` sql`${c1} > ${v1} AND ${c2} < ${v2}` `` | `and(gt(c1, v1), lt(c2, v2))` |
| `` sql`${col} IS NULL` `` | `isNull(col)` |
| `` sql`${col} LIKE ${pat}` `` | `like(col, pat)` / `ilike(col, pat)` |

**Operadores disponibles:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `inArray`, `notInArray`, `isNull`, `isNotNull`, `like`, `ilike`, `between`, `and`, `or`, `not`, `exists`.

**Raw SQL solo para:** funciones específicas de BD sin equivalente Drizzle (ej: `to_tsvector`, extensiones).

**Consultas dinámicas:**
```typescript
const conditions = [];
if (userId) conditions.push(eq(table.userId, userId));
if (status) conditions.push(eq(table.status, status));
if (tags.length) conditions.push(inArray(table.tags, tags));

const result = await db.select().from(table).where(and(...conditions));
```

---

## Identity Columns (PostgreSQL — patrón recomendado v1.0)

**Usar identity columns en lugar de serial** para columnas auto-incrementales:

```typescript
// ❌ Legacy — serial
id: serial('id').primaryKey(),

// ✅ Recomendado — identity column
id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
```

**Ventajas:** Control explícito de secuencia, compatible con `$returningId()` en MySQL, estándar SQL.

---

## Sintaxis pgTable: Arrays (no objetos)

La función de configuración de `pgTable` debe retornar un **array** — la sintaxis de objeto está deprecada:

```typescript
// ❌ Deprecado — retorna objeto
export const users = pgTable("users", { ... }, (t) => ({
    name_idx: index('name_idx').on(t.name),
}));

// ✅ Correcto — retorna array
export const users = pgTable("users", { ... }, (t) => [
    index('name_idx').on(t.name),
    unique('email_unique').on(t.email),
    foreignKey({ columns: [t.orgId], foreignColumns: [orgs.id] }).onDelete("cascade"),
]);
```

---

## Estructura de Archivos de Migración

```
drizzle/migrations/
  {tag}.sql                    # Up migration (generado por Drizzle)
  {tag}/down.sql               # Down migration (tu creas esto)
  meta/_journal.json           # Journal de migraciones
  meta/{idx}_snapshot.json     # Snapshot de schema
```

**CRITICO: NUNCA modificar archivos de migration originales** — solo crear `down.sql` en subdirectorios.

## Mapeo Operacion → Reversion

| Operacion UP | Operacion DOWN |
|-------------|---------------|
| `CREATE TABLE "t" (...)` | `DROP TABLE IF EXISTS "t"` |
| `DROP TABLE "t"` | INTERVENCION MANUAL (perdida de datos) |
| `ADD COLUMN "col" type` | `DROP COLUMN IF EXISTS "col"` |
| `DROP COLUMN "col"` | INTERVENCION MANUAL (perdida de datos) |
| `RENAME COLUMN "a" TO "b"` | `RENAME COLUMN "b" TO "a"` |
| `ALTER COLUMN "c" TYPE int` | `ALTER COLUMN "c" TYPE text` (puede perder datos) |
| `CREATE INDEX "idx" ON "t"` | `DROP INDEX IF EXISTS "idx"` |
| `ADD CONSTRAINT "c"` | `DROP CONSTRAINT IF EXISTS "c"` |

---

## Migraciones: Seguridad

### Backward-compatible
1. Agregar columnas como nullable o con defaults
2. Nunca eliminar columnas en la misma migración que cambios de código
3. Multi-fase para breaking changes: agregar nueva → poblar → hacer NOT NULL → eliminar vieja

### DROP antes de CREATE para funciones PostgreSQL

`CREATE OR REPLACE FUNCTION` **no permite** cambiar nombres de parámetros.

```sql
-- ✅ Correcto: DROP primero con firma exacta
DROP FUNCTION IF EXISTS match_text_chunks(vector, uuid, double precision, integer, text[]);

-- Luego CREATE (sin OR REPLACE)
CREATE FUNCTION match_text_chunks(
    query_embedding vector(768),
    p_user_id uuid,
    p_match_threshold float DEFAULT 0.7,
    p_match_count int DEFAULT 10,
    p_embedding_types text[] DEFAULT NULL
) RETURNS TABLE (...) LANGUAGE plpgsql AS $$ ... $$;
```

**Tipos para DROP:** `float` → `double precision`, `int` → `integer`, `vector(768)` → `vector`.

`CREATE OR REPLACE` es seguro **solo** cuando cambia el cuerpo de la función (misma firma).

---

## Rollback de Dos Fases

### Fase 1: Rollback de Base de Datos (solo si migration fue aplicada)
1. Ejecutar `down.sql` contra la base de datos
2. Eliminar registro de `drizzle.__drizzle_migrations`

### Fase 2: Limpieza Local (siempre)
1. Eliminar `{tag}.sql` y carpeta `{tag}/`
2. Eliminar `meta/{idx}_snapshot.json`
3. Actualizar `meta/_journal.json` — eliminar ultima entrada

### Post-Rollback
- Ejecutar `npm run db:status` para verificar
- Para recrear: `npm run db:generate`

---

## Boundaries (cero tolerancia)

- **SIEMPRE** usa operadores Drizzle sobre raw SQL (previene SQL injection + type safety)
- **SIEMPRE** usa sintaxis de array para constraints de pgTable
- **SIEMPRE** usa foreign key constraints para integridad referencial
- **SIEMPRE** agrega índices en columnas usadas en WHERE/JOIN/ORDER BY
- **NUNCA** uses `npx drizzle-kit` directamente — usa scripts npm
- **NUNCA** hagas cambios destructivos de schema sin plan multi-fase
