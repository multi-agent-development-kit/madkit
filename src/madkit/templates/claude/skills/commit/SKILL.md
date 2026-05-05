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

## Paso 2: Staging Selectivo

**NUNCA `git add .` ni `git add -A`** — siempre `git add <archivos-específicos>`

- Identificar archivos relacionados a este commit
- Si hay cambios no relacionados, recomendar commits separados
- Verificar con `git diff --cached --stat`

**Si el usuario insiste en `git add .`:**
- Ejecutar, luego INMEDIATAMENTE: `git reset HEAD ai_docs/ .claude/ .cursor/ 2>/dev/null`

---

## Paso 3: Mensaje de Commit

```
<type>: <línea de asunto bajo 50 caracteres>

<cuerpo: qué cambió y por qué, wrap a 72 caracteres>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

- Modo imperativo, minúsculas tras prefijo, sin punto final en asunto
- El cuerpo explica QUÉ y POR QUÉ, no CÓMO
- Si se proporcionó `$ARGUMENTS`: usarlo como base

---

## Paso 4: Estrategia de Commit

**Comprensivo (por defecto):** Un commit para trabajo relacionado
**Atómico (PR-ready):** Una unidad lógica por commit — cuando hay features independientes, áreas no relacionadas, o se prepara para code review

Presentar al usuario antes de ejecutar:
```
Estrategia: [Comprensivo / Atómico]
Archivos: [cantidad] archivos staged
Mensaje: [mensaje propuesto]
¿Proceder? (S/n)
```

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
