# Tarea 999: ejemplo válido con Criterios de Calidad de Ingeniería canónicos

> **Asunciones:** entorno Node ≥20 disponible. Esta fixture cita un archivo `.ts` ejecutable y debe pasar el validator v1.3.0 con los 4 criterios canónicos presentes.

---

## 1. Resumen

### Título
Fixture para tests de Engineering Hygiene Criteria del task-doc-validator v1.3.0.

### Objetivo
Probar que un task doc bien formado con código ejecutable Y los 4 criterios canónicos pasa el validator (exit 0).

### Alcance

**Incluye:**
- Refactor de `src/utils/parser.ts` para añadir validación de input.
- Tests unitarios reutilizando `tests/fixtures/parser-fixtures.ts` existente.

**No incluye:**
- Refactor de módulos no relacionados.

### Criterios de Éxito
- [ ] El validator devuelve exit 0 sobre este archivo.
- [ ] No hay BLOCKERs reportados pese a citar `.ts` ejecutable.
- [ ] Los 4 criterios canónicos están presentes en la sección.

### Criterios de Calidad de Ingeniería (canónicos)

> **Obligatorio si la task toca código ejecutable.**

- [ ] **Cleanup exhaustivo de comentarios:** archivos modificados sin comentarios narrativos, sin TODO/FIXME residual sin issue trackeado, sin código comentado. Verificable: `grep -nE "(TODO|FIXME|XXX)" src/utils/parser.ts` retorna ≤ baseline + `eslint` sin reportar `no-warning-comments`.
- [ ] **Sin dead/legacy code:** sin imports/exports/variables huérfanas. Verificable: `ts-unused-exports tsconfig.json` + `grep -r "validateInput"` confirma callers.
- [ ] **DRY/KISS/early returns aplicados:** sin duplicación >3L, sin abstracciones para 1 callsite, early return guard en validación de null. Verificable: revisión humana + reviewer §9.
- [ ] **TDD reutilizando infra existente:** `src/utils/parser.test.ts` creado importando de `tests/fixtures/parser-fixtures.ts`. Kill-the-mutant: comentar `if (!input)` → al menos 1 test falla.

---

## 2. Impactos esperados

- `src/utils/parser.ts` (modificado, +25 líneas)
- `src/utils/parser.test.ts` (creado, ~80 líneas)

**Tamaño estimado:** 100-130 líneas en 2 archivos.

### Wiring esperado

- `parser.ts` referenciado desde `src/api/handlers.ts` y `src/api/routes.ts`.
- `parser.test.ts` ejecutable vía `npm test`.

---

## 3. Casos límite mínimos

- **Input vacío / null / no existente:** parser recibe `null` o string vacío → retorna `Result.error('empty input')`.
- **Fallo de dependencia externa:** parser usa `JSON.parse` que puede lanzar SyntaxError → captura y retorna `Result.error(err.message)`.
- **Estado tras error parcial:** parser es puro, sin estado mutable — sin riesgo de error parcial.

---

## 4. Lifecycle

- **Creado:** 2026-05-10
- **Estado:** ABIERTA
