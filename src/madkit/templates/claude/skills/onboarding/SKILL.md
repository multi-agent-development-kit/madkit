---
name: onboarding
description: "Validación del ecosistema de plantillas. Activar tras /calibrate_templates, /setup_project, al incorporar templates a un proyecto nuevo, o cuando se detecten inconsistencias entre templates desplegadas y el stack."
---

# Validación de Ecosistema de Plantillas

> Verifica que el despliegue de plantillas es coherente: stack correcto, referencias válidas, frontmatter consistente, protecciones activas.

---

## Paso 1: Inventario de Plantillas Desplegadas

Catalogar todo lo desplegado:

```bash
# Comandos
ls .claude/commands/*.md 2>/dev/null

# Skills (formato carpeta/SKILL.md)
find .claude/skills/ -name "SKILL.md" 2>/dev/null

# Agentes
ls .claude/agents/*.md 2>/dev/null
```

Construir tabla resumen:
```
Comandos: [N] archivos
Skills: [M] carpetas
Agentes: [K] archivos
Total: [N+M+K] plantillas desplegadas
```

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
# Para cada skill/agent/command, buscar referencias a otros que no existen
grep -rn "skill\|agent\|command\|template" .claude/commands/ .claude/skills/ .claude/agents/ 2>/dev/null
```

Verificar que:
- [ ] Cada `/nombre_comando` referenciado existe en `.claude/commands/`
- [ ] Cada skill referenciado existe en `.claude/skills/nombre/SKILL.md`
- [ ] Cada agente referenciado existe en `.claude/agents/`
- [ ] Campo `skills:` en frontmatter de agentes apunta a skills desplegados

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

**Referencia de modelo esperado en agents** (8 subagents tras tasks 072+085, ver `CLAUDE.md` sección "Modelo por perfil de trabajo"):
- `task-planner`: opus
- `reviewer`: opus
- `adk`: opus
- `implementer`: sonnet
- `doc-syncer`: sonnet
- `researcher`: sonnet
- `orientador`: sonnet
- `git-guardian`: haiku

**Skills con `context: fork` + `agent:` esperadas:**
- `unit-testing` → `implementer`
- `cleanup`, `cleanup-python`, `cleanup-django`, `cleanup-php` → `implementer`
- `task-implementation-review` → `reviewer`

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

| Verificación | Estado |
|---|---|
| `ai_docs/` existe | PASA / FALLA |
| `ai_docs/tasks/` existe | PASA / FALLA |
| `ai_docs/core/` existe | PASA / FALLA / N/A |
| `ai_docs/core/master_idea.md` existe | PASA / FALLA / N/A |
| Calibración ejecutada (`ai_docs/tasks/000_calibracion_proyecto.md`) | PASA / FALLA |
| `CLAUDE.md` existe en la raíz del proyecto | PASA / FALLA |
| `CLAUDE.md` contiene sección "Estilo de respuesta" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Estructura de carpetas (canónica en todos los proyectos)" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Modelo por perfil de trabajo" | PASA / FALLA |
| `CLAUDE.md` contiene sección "Cuándo delegar a subagentes" | PASA / FALLA |
| `CLAUDE.md` NO tiene placeholders `[entre corchetes]` pendientes | PASA / FALLA (listar los que quedan) |

**Si falta CLAUDE.md:** recomendar ejecutar `/setup_project` para generarlo desde el template.
**Si faltan secciones del template:** recomendar mergear desde `CLAUDE.md.template` sin sobrescribir el contenido existente.
**Si hay placeholders pendientes:** recomendar ejecutar `/calibrate_templates` para rellenarlos con contexto del proyecto.

---

## Paso 7: Generar Reporte

Presentar reporte consolidado:

```
=== Validación de Ecosistema de Plantillas ===

Stack detectado: [stack]
Plantillas desplegadas: [N] comandos | [M] skills | [K] agentes

VERIFICACIÓN                          ESTADO
─────────────────────────────────────────────
Templates vs stack                    [PASA/FALLA]
Referencias cruzadas                  [PASA/FALLA] ([N] rotas)
Frontmatter consistente               [PASA/FALLA] ([N] issues)
Descriptions sin conflicto            [PASA/FALLA]
Protecciones scaffolding              [PASA/FALLA] ([N] faltantes)
Documentación core                    [PASA/FALLA]
Calibración previa                    [PASA/FALLA]

RESULTADO: [N] PASA | [M] FALLA

Acciones recomendadas:
1. [acción prioritaria si hay fallos]
2. [siguiente acción]
```

---

## Reglas

1. **Solo lectura** — este skill NO modifica archivos, solo reporta
2. **Sin falsos positivos** — solo reportar problemas verificados, no suposiciones
3. **Acciones concretas** — cada FALLA incluye la acción correctiva específica
