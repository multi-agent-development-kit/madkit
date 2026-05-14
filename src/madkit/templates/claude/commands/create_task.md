# Crear Tarea (delegador a `task-planner`)

> Este command es un **delegador**. Para crear una tarea nueva, invoca al subagent `task-planner` describiendo el trabajo a planificar — el subagent cubre todo el flujo (triaje, detección de stack, carga de la reference apropiada, creación del task doc con numeración secuencial).

---

## Ruta canónica

`task-planner` (opus, xhigh) ejecuta:

1. **Triaje de complejidad** — SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA según radio de impacto, atomicidad, prerequisitos.
2. **Detección de stack** — y carga del delta apropiado desde `.claude/commands/references/task_template_<stack>.md`.
3. **Creación del task doc** — `ai_docs/tasks/NNN_*.md` con numeración secuencial atómica.
4. **Encadenamiento downstream** — plan-checker (gate adversarial 10 dimensiones D1-D10) → implementer (× N paralelo si módulos disjuntos) → reviewer (correlacionado, NUNCA fragmentar) → doc-syncer → git-guardian.

---

## Por qué este command es delegador

La regla canónica establece que **solo `task-planner` crea task docs en `ai_docs/tasks/`**. Esto garantiza:

- **Triaje consistente.** Cada task tiene clasificación de complejidad razonada.
- **plan-checker downstream.** Cada task creada pasa por gate adversarial antes de implementar.
- **Trazabilidad y numeración secuencial atómica.** Sin colisiones cuando se crean tasks en paralelo.
- **Activación de waves del DAG.** Si la task declara `> **Depende de:**`, se respeta el orden topológico.

Tipear `/create_task` directamente desde main session bypassea esta regla — `task-planner` no realiza triaje y los downstream agents (plan-checker, implementer) operan sobre un task incompleto.

---

## Acción del agent invocador

**Si recibes este command como entrada:** invoca al subagent `task-planner` con la descripción del usuario tal cual. NO escribas en `ai_docs/tasks/` desde main session. Ejemplo:

```
Usuario: /create_task añadir auth con email/password al frontend
Main session: [delega a subagent task-planner con prompt "añadir auth con email/password al frontend"]
```

---

## Skills relacionadas

- `task-creator` — skill que detecta número y stack (ruta similar a este command pero accionable por agent en flujos auto-activados).
- `roadmap-generator` — skill `context: fork` → `task-planner` para generar **sprints completos** con waves del DAG y task docs vinculados. Trigger: épicas multi-task.

---

## Casos de uso

| Caso | Acción |
|------|--------|
| Tarea atómica nueva | invoca `task-planner` |
| Épica con múltiples tasks dependientes | invoca skill `roadmap-generator` (o `/sprint <descripción>`) |
| Caso emergencia: usuario quiere flujo manual sin agent | usar `/task_template` (genérico) como guía estructural — sin delegación, el usuario asume responsabilidad de triaje |

---

> La regla canónica de creación de task docs (solo `task-planner`) está documentada en `CLAUDE.md` raíz §"Cuándo delegar" / "Responsabilidad de creación de task docs".
