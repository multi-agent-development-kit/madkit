---
name: onboarding
description: "Validación del ecosistema de plantillas. Activar tras la skill calibrate-templates, /setup_project, al incorporar templates a un proyecto nuevo, o cuando se detecten inconsistencias entre templates desplegadas y el stack."
---

# Validación de Ecosistema de Plantillas

> Verifica que el despliegue de plantillas es coherente: stack correcto, referencias válidas, frontmatter consistente, protecciones activas.

---

## Paso 1: Inventario de Plantillas Desplegadas

```bash
ls .claude/commands/*.md 2>/dev/null
find .claude/skills/ -name "SKILL.md" 2>/dev/null
ls .claude/agents/*.md 2>/dev/null
```

Construir tabla resumen: `Comandos: N | Skills: M | Agentes: K | Total: N+M+K`.

---

## Paso 2: Verificación de Stack

Detectar stack del proyecto y cruzar con plantillas desplegadas:

| Verificación | Método | Resultado |
|---|---|---|
| Stack detectado | Analizar manifests (package.json, pyproject.toml, etc.) | [stack] |
| Templates irrelevantes | Comparar stack vs plantillas desplegadas | PASA / FALLA |

**Si FALLA:** Listar plantillas que NO corresponden al stack detectado y recomendar eliminación.

---

## Paso 3: Integridad de Referencias Cruzadas

```bash
grep -rn "skill\|agent\|command\|template" .claude/commands/ .claude/skills/ .claude/agents/ 2>/dev/null
```

Verificar: cada `/comando` existe en `.claude/commands/`; cada skill referenciada en `.claude/skills/nombre/SKILL.md`; cada agente en `.claude/agents/`; `skills:` en frontmatter apunta a skills desplegadas.

| Referencia | Origen | Destino | Estado |
|---|---|---|---|
| ... | ... | ... | PASA / ROTA |

---

## Paso 4: Consistencia de Frontmatter

**Subagents (`.claude/agents/*.md`):**

| Archivo | `name:` | `description:` presente | `model:` declarado | Largo description |
|---|---|---|---|---|
| ... | ... | ✅/❌ | opus/sonnet/haiku/❌ | [chars] |

**Skills (`.claude/skills/<name>/SKILL.md`):**

| Archivo | `name:` | Coincide con carpeta | `description:` presente | Largo description | `model:` AUSENTE | `context: fork` | `agent:` válido |
|---|---|---|---|---|---|---|---|
| ... | ... | ✅/❌ | ✅/❌ | [chars] | ✅/❌ | opcional | ✅/❌/N/A |

**Verificaciones:**
- [ ] Todos los skills y agents tienen `name:` + `description:`
- [ ] `name:` coincide exactamente con el nombre de la carpeta/archivo
- [ ] **`model:` declarado explícitamente en TODOS los agents** (opus/sonnet/haiku). Si falta → FALLA.
- [ ] **`model:` AUSENTE en TODAS las skills.** Si alguna skill tiene `model:` directamente (sin `context: fork`) → FALLA: forzar modelo en skill causa errores de facturación en sesión heredada. Eliminar.
- [ ] **Skills con `context: fork`**: el valor en `agent:` DEBE referenciar un subagent desplegado en `.claude/agents/`. Si el subagent referenciado no existe → FALLA (la skill intentará ejecutarse en un fork que no puede instanciarse). Fix: desplegar el subagent o eliminar `context: fork` + `agent:`.
- [ ] **Skills con `paths:`**: verificar formato glob válido. Alertar si es demasiado restrictivo (se activará en muy pocos casos).
- [ ] Descriptions bajo ~200 caracteres (alertar si >250)
- [ ] No hay descriptions duplicadas que causen activación ambigua

**Referencia de modelo esperado en agents** (8 subagents, ver `CLAUDE.md` §1.4 "Asignación de modelos"): opus×1 (`reviewer`) · sonnet×5 (`task-planner`, `adk`, `implementer`, `doc-syncer`, `researcher`) · haiku×2 (`orientador`, `git-guardian`).

**Skills con `context: fork` + `agent:` esperadas** (ver `CLAUDE.md` §1.3): `unit-testing`, `cleanup`, `cleanup-python`, `cleanup-django`, `cleanup-php` → `implementer`; `task-implementation-review`, `plan-checker`, `roadmap-reviewer`, `bugfix` → `reviewer`; `roadmap-generator` → `task-planner`.

**Nota — commands vs skills:** `sync-upstream-trigger` se despliega como `.claude/commands/sync-upstream-trigger.md`, no como skill. Las referencias textuales a su nombre en otros templates no indican una skill faltante. Commands en `.claude/commands/` — excluir de la verificación de skills desplegadas: `sync-upstream-trigger`, `setup_project`, `create_task`, `task_template`.

---

## Paso 5: Protecciones Anti-Scaffolding

| Protección | Verificación | Estado |
|---|---|---|
| `.gitignore` incluye `ai_docs/` | `grep "ai_docs" .gitignore` | PASA / FALLA |
| `.gitignore` incluye `.claude/` | `grep ".claude" .gitignore` | PASA / FALLA |
| `.gitignore` incluye `.cursor/` | `grep ".cursor" .gitignore` | PASA / FALLA |
| Skill `commit` tiene guardia scaffolding | Verificar sección de guardia | PASA / FALLA |
| Skill `pr` tiene verificación de leakage | Verificar sección de leakage | PASA / FALLA |

---

## Paso 6: Documentación Core y CLAUDE.md

Inventario canónico esperado en `ai_docs/core/` (ver `CLAUDE.md` §"Inventario canónico de ai_docs/core/"): `master_idea.md`, `architecture.md`, `data_models.md`, `decisions.md` (lazy). Operativos en `ai_docs/_meta/`: `ecosystem_state.md`, `setup_report.md`.

| Verificación | Estado |
|---|---|
| `ai_docs/` existe | PASA / FALLA |
| `ai_docs/tasks/` existe | PASA / FALLA |
| `ai_docs/core/` existe | PASA / FALLA / N/A |
| `ai_docs/_meta/` existe | PASA / FALLA / N/A |
| `ai_docs/core/master_idea.md` existe | PASA / FALLA / N/A |
| `ai_docs/core/architecture.md` existe | PASA / FALLA / N/A |
| `ai_docs/core/data_models.md` existe | PASA / FALLA / N/A |
| Sin archivos legacy en `core/` (`system_architecture.md`, `initial_data_schema.md`, `app_pages_and_functionality.md`, `wireframe.md`, `ui_theme.md`, `app_name.md`) | PASA / FALLA (listar) |
| `ai_docs/_meta/ecosystem_state.md` existe (si calibrado) | PASA / FALLA / N/A |
| Calibración ejecutada (`ai_docs/_meta/calibration_log.md`) | PASA / FALLA |
| `CLAUDE.md` existe en la raíz del proyecto | PASA / FALLA |
| `CLAUDE.md` contiene sección "Estilo de respuesta" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Estructura de carpetas (canónica en todos los proyectos)" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Inventario canónico de ai_docs/core/" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Modelo por perfil de trabajo" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Cuándo delegar a subagentes" | PASA / FALLA |
| `CLAUDE.md` NO tiene placeholders `[entre corchetes]` pendientes | PASA / FALLA (listar los que quedan) |

**Si falta CLAUDE.md:** recomendar ejecutar `/setup_project` para generarlo desde el template.
**Si faltan secciones del template:** recomendar mergear desde `CLAUDE.md.template` sin sobrescribir el contenido existente.
**Si hay placeholders pendientes:** recomendar activar la skill `calibrate-templates` para rellenarlos con contexto del proyecto.
**Si hay archivos legacy en `core/`:** listar al usuario y recomendar migración manual al inventario canónico (renombrar/fusionar) — **nunca renombrar silentemente.**

---

## Paso 7: Generar Reporte

Tabla consolidada con una fila por verificación: `Stack vs templates | Referencias cruzadas | Frontmatter | Descriptions | Scaffolding | Docs core | Calibración` — cada celda `PASA / FALLA (N issues)`. Cierre: `RESULTADO: N PASA | M FALLA`. Listar acciones correctivas para cada FALLA por orden de prioridad.

**Handoff al siguiente agente:** escribir `ai_docs/_meta/onboarding_report.md` con el reporte completo, encabezado con:
```
generated_at: <ISO-8601>
issues_count: <N>
```
Sobrescribir si existe. `doc-syncer` lo lee en Paso 0 si `generated_at` <2h. Escribir siempre, incluso si `issues_count: 0`.

---

## Reglas

1. **Solo lectura** — este skill NO modifica archivos, solo reporta
2. **Sin falsos positivos** — solo reportar problemas verificados, no suposiciones
3. **Acciones concretas** — cada FALLA incluye la acción correctiva específica
