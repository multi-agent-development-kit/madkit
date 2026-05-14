---
name: pr
description: "Creación o revisión de Pull Requests con verificación anti-scaffolding. NUNCA activar automáticamente — solo cuando el usuario pida DIRECTAMENTE 'crea PR', 'abre PR', 'revisa PR' o invoque /pr. Para flujos completos (sync + push + PR) → git-guardian."
argument-hint: "[número de PR | create]"
disable-model-invocation: true
effort: low
---

# Revisión y Creación de PR

> Revisa calidad, verifica leakage de AI scaffolding, evalúa tamaño, y opcionalmente crea el PR.

**Input:** `$ARGUMENTS` — número de PR a revisar, o "create" para crear uno nuevo

---

## Paso 1: Verificación de Leakage de Scaffolding (BLOQUEANTE)

| Patrón | Descripción |
|---------|-------------|
| `ai_docs/**` | Documentos de tareas, referencias |
| `.claude/**` | Commands, agents, skills |
| `.cursor/**` | Reglas de codificación IDE |
| `task_template*` | Archivos de plantilla de tarea |
| `NNN_*.md` (prefijo 3 dígitos) | Docs de tracking de tareas |

**Detección según contexto:**
- PR existente: `gh pr diff <number> --name-only`
- Crear PR: `git diff origin/main...HEAD --name-only`
- En main: `git diff HEAD --name-only`

**Si se encuentra scaffolding:** DETENER. Remover con `git rm -r --cached <path>` o `git reset HEAD <path>`. No proceder hasta limpio.

---

## Paso 2: Evaluación de Tamaño

| Líneas Cambiadas | Clasificación | Recomendación |
|------------------|---------------|---------------|
| 1-100 | Pequeño | Revisar tal cual |
| 101-300 | Mediano | Asegurar commits lógicos |
| 301-500 | Grande | Considerar dividir |
| 500+ | Muy Grande | WARNING — recomendar dividir |

---

## Paso 3: Escaneo de Calidad

1. **Código muerto:** Funciones vacías, imports no usados, código comentado
2. **Seguridad:** Secrets hardcoded, API keys expuestos, SQL injection
3. **Type safety:** Tipos `any`/`Any`, return types faltantes
4. **Error handling:** Cláusulas except vacías, errores tragados
5. **Arquitectura:** Imports mixtos server/client, prop drilling innecesario

**Formato de reporte:**
```
BLOCKING: [cantidad] issues (corregir antes de merge)
WARNING: [cantidad] issues (deberían corregirse)
CLEAN: [cantidad] áreas pasaron
```

---

## Paso 4: Acción

**Número de PR** → `gh pr view/diff <number>` → Pasos 1-3 → publicar resumen

**"create"** → Pasos 1-3 en rama actual → si pasa:

**BLOQUEANTE pre-creación:** verificar que el body no contiene `Co-Authored-By: Claude/anthropic`. Si está presente, eliminar antes de ejecutar `gh pr create`.

```bash
gh pr create --title "<type>: <description>" --body "$(cat <<'EOF'
## Resumen
- [cambios en bullet points]

## Plan de Pruebas
- [ ] [cómo testear]
EOF
)"
```
Reportar URL al usuario.

**Sin argumentos** → Pasos 1-3 en cambios actuales → preguntar: "¿Crear PR? ¿Push? ¿Corregir problemas primero?"

---

## Paso 5: Estrategia de Stacking (activación condicional)

**Cuándo se activa este sub-flow:**
- El task doc en curso (`ai_docs/tasks/NNN_*.md` o `NNN_sNN_*.md`) declara **`> **Sprint:** NN`**, O
- El task doc declara `> **Depende de:**` con 1+ IDs, O
- "Tamaño estimado" en "Impactos esperados" excede 400 líneas, O
- El usuario explícitamente pide "abrir cadena de PRs" o "split en stacked PRs".

**Cuándo NO se activa:**
- Tarea aislada sin dependencias declaradas, sin Sprint, y forecast ≤400 → flujo PR estándar (Pasos 1-4 sin esta sección).

### 5.1 — Decisión de strategy (preguntar UNA vez por sesión)

Si `ai_docs/STATE.md` tiene `pr_strategy` cacheado, reusar. Si no, presentar las 4 opciones al usuario:

| Strategy | Cuándo |
|---|---|
| **Sprint PR único** (default cuando sprint cierra todas las waves) | Sprint COMPLETADA: 1 PR a main agrupa N commits work-unit (1 por tarea). Granularidad por commit; rollback granular tarea-a-tarea. Subject del PR: `<type>: <título descriptivo de la épica>`. |
| **Stacked PRs to main** | Slices independientes, velocidad sobre control |
| **Feature Branch Chain** | Control de integración, releases coordinadas, mejor rollback |
| **size:exception** | PR único grande con aprobación explícita (generado, migraciones, vendor) |

**Recomendación:** si la task pertenece a sprint Y todas las tasks del sprint están COMPLETADAS, sugerir **Sprint PR único** como default. El usuario puede degradar a Stacked PRs por wave si prioriza revisión wave-a-wave sobre velocidad.

Cachear en `ai_docs/STATE.md` campo `pr_strategy`. NO volver a preguntar en waves siguientes.

### 5.2 — Diagrama Mermaid de la cadena

Renderizar `graph LR` con las waves de task-planner: `main → PR1[Wave 1] → PR2[Wave 2] → ...`. Marcar el PR actual con etiqueta visible.

### 5.3 — Bloque "Chain Context" en el PR body

Añadir antes del Test Plan. Campos requeridos: Chain · Tracker PR (`#NNN` o `N/A si stacked`) · Position (`N de M`) · Base branch · Depende de · Follow-up · Review budget (`<changed lines> / 400`). Incluir el diagrama Mermaid del 5.2 y checklist de autonomy (CI verde · deliverable único · rollback aislado · tests/docs cubren esta unidad).

### 5.4 — Comandos `gh` con bases correctas

| Strategy | Comando |
|---|---|
| **Sprint PR único** | `gh pr create --base main --head <sprint_branch> --title "<type>: <título descriptivo de la épica>"`. Body: lista de unidades completadas (1 por commit work-unit con su mensaje descriptivo), DAG §4 del sprint doc, plan de pruebas con checklist por unidad. |
| **Stacked PRs to main** | `gh pr create --base main --head <wave_branch>`. Tras merge de PR N, retargetear PR N+1 a main y rebase. |
| **Feature Branch Chain** | PR 1: `gh pr create --base feat/<feature> --head <child_branch>`. PR N (N>1): `gh pr create --base <branch_de_PR_N-1> --head <child_branch>`. Tracker PR `feat/<feature> → main` en `--draft` hasta cierre. |
| **size:exception** | PR único, justificar tamaño en `--body`: `> **size:exception:** <razón>`. |

### 5.5 — Anti-patterns

- Mezclar strategies dentro de la misma cadena.
- Crear child PR sin diagrama del Paso 5.2.
- Mergear tracker PR antes de cerrar todos los child PRs (Feature Branch Chain).
- Apuntar child PRs a `main` cuando se eligió Feature Branch Chain → diff inflado con cambios de PRs anteriores.
- Re-preguntar strategy en wave 2+ si ya está cacheada en STATE.md.

---

## Reglas

1. **Verificación de scaffolding SIEMPRE primero** — sin excepciones
2. **Nunca crear PR con archivos de scaffolding**
3. **Presentar revisión antes de crear** — el usuario aprueba
4. **Código muerto se elimina**, no se documenta con TODOs
5. **`Co-Authored-By: Claude/anthropic` prohibido** en body y título — control primario; scaffolding-guard es red de seguridad secundaria
