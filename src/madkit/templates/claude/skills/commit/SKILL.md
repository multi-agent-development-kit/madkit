---
name: commit
description: "Commit Git con guardia anti-scaffolding. Activar cuando el usuario quiera commitear o hacer commit de sus cambios. Para operaciones multi-paso (push+PR, sync, conflictos) → git-guardian."
argument-hint: "[mensaje de commit]"
effort: low
---

# Flujo de Trabajo Git Commit

> Analiza cambios, aplica exclusión de AI scaffolding, crea commits limpios. Usar esto en lugar de hacer commit directamente.

**Input:** `$ARGUMENTS` — mensaje de commit opcional o contexto

---

## Paso 1: Guardia de AI Scaffolding (BLOQUEANTE)

Estas rutas NUNCA deben ser committed:
```
ai_docs/          # Documentos de tareas, referencias, workflow AI
.claude/          # Commands, agents, skills
.cursor/          # Reglas de codificación IDE
```

1. Ejecutar `git status`
2. Si cualquiera de las rutas aparece staged/modified/untracked:
   - `git reset HEAD ai_docs/ .claude/ .cursor/ 2>/dev/null`
   - Advertir: "Archivos de AI scaffolding detectados y excluidos del commit"
3. **NUNCA proceder si hay scaffolding staged**

---

## Pre-commit: estructura por unidad de trabajo

Antes de stagear, comprobar que el commit es UNA unidad entregable, no un batch por tipo de archivo.

**Reglas:**
- 1 commit = 1 comportamiento, fix, migración o unidad de docs entregable.
- Tests viajan con el comportamiento que verifican. Docs viajan con la feature que explican.
- NO commitear "primero models, luego services, luego tests" si ninguno aporta valor solo.
- El repo debe tener sentido tras aplicar SOLO este commit (rollback razonable sin tocar work ajeno).
- El mensaje explica el outcome, no la lista de archivos.

**Split débil vs split por work-unit:**

| Débil | Por work-unit |
|---|---|
| `add models` | `feat(auth): add token validation domain model and tests` |
| `add services` | `feat(auth): wire token validation into login flow` |
| `add tests` | (incluido con el commit del comportamiento) |

**Stacking:** si el cambio supera 400 líneas, partir en commits work-unit e invocar "Estrategia de stacking" de la skill `pr` antes del push.

---

## Paso 2: Staging Selectivo

**NUNCA `git add .` ni `git add -A`** — siempre `git add <archivos-específicos>`

- Identificar archivos relacionados a este commit
- Si hay cambios no relacionados, recomendar commits separados
- Verificar con `git diff --cached --stat`

**Si el usuario insiste en `git add .`:**
- Ejecutar, luego INMEDIATAMENTE: `git reset HEAD ai_docs/ .claude/ .cursor/ 2>/dev/null`

---

## Paso 3: Mensaje de Commit

Formato: `<type>: <asunto en imperativo, ≤72 chars, sin punto final>` + cuerpo opcional (qué cambió y por qué, wrap 72 chars).

- Tipos válidos (CLAUDE.md §3.4): `create`, `optimize`, `update`, `fix`, `refactor`
- Asunto: imperativo, minúsculas tras prefijo, sin punto final. Cuerpo: QUÉ y POR QUÉ, no CÓMO
- Si se proporcionó `$ARGUMENTS`: usarlo como base
- **PROHIBIDO `Co-Authored-By:`** — el commit lo firma exclusivamente el git user configurado. Verificación: `grep -i "co-authored" <msg>` debe retornar vacío. El hook `scaffolding-guard` bloquea si detecta `Co-Authored-By:` con `Claude` o `anthropic`.

---

## Paso 4: Estrategia de Commit

| Estrategia | Cuándo |
|---|---|
| **Comprensivo** (por defecto) | Trabajo relacionado en una sola unidad |
| **Atómico** (PR-ready) | Features independientes, áreas no relacionadas, revisión por commit |

Presentar al usuario (estrategia · archivos staged · mensaje propuesto) y pedir confirmación antes de ejecutar.

---

## Paso 5: Ejecutar y Verificar

1. Crear el commit
2. `git log --oneline -1` + `git status` para verificar

**Si falla por pre-commit hook:**
- Corregir el problema
- Crear NUEVO commit (nunca --amend a menos que se pida explícitamente)

---

## Reglas

1. **NUNCA staging de `ai_docs/`, `.claude/`, `.cursor/`** — innegociable
2. **NUNCA push** a menos que el usuario lo pida — este skill solo hace commit
3. **NUNCA amend** sin pedido explícito — siempre nuevos commits
4. **SIEMPRE presentar mensaje** para aprobación antes de ejecutar
