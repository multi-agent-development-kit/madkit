# Tarea 999: Fixture D9 — fases declaradas paralelas con overlap de archivos

> **Estado:** ABIERTA — fixture
> **Complejidad:** ESTÁNDAR
> **Alcance:** `src/auth.ts` (modificado), `src/user.ts` (modificado)
> **Asunciones:** este task doc es un fixture para auditoría manual de plan-checker D9 (T119); NO se ejecuta.

---

## 1. Resumen

### Título
Fixture de prueba para Dimension 9 (Phase Disjunction) de plan-checker — caso BLOCKER esperado.

### Objetivo
Caso de prueba: declarar `parallelizable_phases: [[1, 2]]` en `contract:` (Fase 1 y Fase 2 en la misma wave interna) pero ambas fases modifican el mismo archivo `src/auth.ts`. plan-checker D9 debería emitir BLOCKER por race condition garantizada.

### Criterios de Éxito

- [ ] plan-checker corriendo sobre este fixture emite `[Dimension 9] Fases 1 y 2 declaradas paralelas en wave interna [1, 2] pero ambas modifican src/auth.ts según Plan de Implementación → race condition garantizada → fix: serializar en [[1], [2]] O reorganizar files_touched para que cada fase toque archivos disjuntos. Mapping: P3+P4.`
- [ ] El veredicto final es BLOCKED.

### Casos límite mínimos

- **Input:** este fixture servido a plan-checker pre-impl. **Esperado:** BLOCKER por D9.
- **Input:** mismo fixture pero con `parallelizable_phases: [[1], [2]]` (serial). **Esperado:** D9 SKIP silente, sin BLOCKER por D9.
- **Input:** fixture sin `contract:` block. **Esperado:** D9 SKIP silente, fixture inválido por T087/T079 pero D9 no aplica.

---

## 2. Plan de Implementación

### Fase 1 — Añadir validación de email en `auth.ts`

Editar `src/auth.ts`:
- Añadir función `validateEmail(email: string): boolean` que verifica formato RFC 5322.
- Llamar `validateEmail()` desde el método existente `login(email, password)` antes de comparar contra DB.

### Fase 2 — Añadir validación de password en `auth.ts`

Editar `src/auth.ts`:
- Añadir función `validatePasswordStrength(password: string): { valid: boolean, reason?: string }` que verifica longitud ≥12 y entropía mínima.
- Llamar `validatePasswordStrength()` desde el método existente `login(email, password)` antes de comparar contra DB.

> **Nota fixture:** Fase 1 y Fase 2 declaradas paralelas en `parallelizable_phases: [[1, 2]]` pero ambas modifican `src/auth.ts` — race condition garantizada si dos `implementer` corren simultáneamente. plan-checker D9 BLOCKER esperado.

---

## 3. Impactos esperados

**Archivos modificados:**

- `src/auth.ts`: +2 funciones nuevas + 2 invocaciones en `login()` (Fases 1 + 2 ambas tocan este archivo — overlap).
- `src/user.ts`: importa `validateEmail` para validación de signup (consumer de Fase 1).

**Wiring esperado:**

- `src/auth.ts` `validateEmail` referenciado/invocado desde `src/user.ts` (signup flow).
- `src/auth.ts` `validatePasswordStrength` referenciado/invocado desde `src/user.ts` (signup flow).

**Tamaño estimado:** 30-50 líneas en 2 archivos.

---

## 4. Riesgos

- **R1 (CRÍTICO en este fixture):** ambas fases modifican el mismo archivo → si se lanzan paralelas según `parallelizable_phases: [[1, 2]]`, el último write gana y se pierden cambios. plan-checker D9 BLOCKER previene este escenario.

---

## 5. Lifecycle

- **Estado:** fixture (no se ejecuta).
- **Uso:** referencia manual citada en `claude-templates/hooks/tests/README.md` para auditorías periódicas de plan-checker D9.

```yaml
contract:
  task_id: "999"
  complexity: "ESTÁNDAR"
  depends_on: []
  forecast:
    min_lines: 30
    max_lines: 50
    files_modified: 2
    files_created: 0
  wiring:
    - "src/auth.ts validateEmail invocado desde src/user.ts signup"
    - "src/auth.ts validatePasswordStrength invocado desde src/user.ts signup"
  files_touched:
    - "src/auth.ts"
    - "src/user.ts"
  parallelizable_phases:
    - [1, 2]   # Wave 1 (FIXTURE BLOCKER): Fase 1 y 2 paralelas pero ambas modifican src/auth.ts
  produced_by: "fixture"
  validated_by: ["plan-checker"]
  consumed_by: []
```
