---
name: adk-agent-orchestrator
description: "Sincronización de arquitectura ADK con documentos de diseño. Activar proactivamente al modificar agent.py, sub_agents/, tools en proyectos ADK. Para diseñar desde cero → adk-workflow-design. Skill del agente adk."
---

## Activación

Este skill se activa cuando se detectan cambios en CUALQUIER aspecto de la arquitectura de agentes ADK:

- Modificación de `agent.py`, `__init__.py`, `config.py` en proyecto ADK
- Cambios en `sub_agents/` (añadir, eliminar, reorganizar)
- Modificación de `tools=` o `sub_agents=` en definiciones de agentes
- Cambios en `output_key`, `output_schema`, o callbacks
- Adición/eliminación de state keys en instrucciones de agentes
- Cambios en patrón de orquestación (Sequential → Parallel, etc.)
- Modificación de archivos de tools (`tools.py`, `tools/`)
- Cambios en evalsets o métricas de evaluación
- Cambios en plugins o configuración de App
- Cambios en `skills/<name>/SKILL.md` o `references/` (SkillToolset) — validar compliance agentskills.io (ver `adk-skills-toolset`)

---

## Protocolo de Sincronización

### Paso 1: Detectar Documento de Diseño

Buscar en `ai_docs/tasks/` un documento que coincida con el workflow actual:
- Buscar archivos con prefijo `DESIGN_` relacionados con el sistema de agentes modificado
- Si no existe documento de diseño: **ADVERTIR** al usuario y sugerir crear uno con `/adk_orchestrator_template`

### Paso 2: Analizar Cambio vs Documento

Comparar el cambio realizado contra el documento de diseño:

| Aspecto | Verificar |
|---------|-----------|
| **Jerarquía de agentes** | ¿El diagrama de conexiones sigue siendo correcto? |
| **State keys** | ¿Todas las keys documentadas siguen existiendo? ¿Hay nuevas sin documentar? |
| **Tools** | ¿La distribución de tools sigue cumpliendo reglas ADK? (1 built-in por agent) |
| **Tipos de agent** | ¿Los tipos asignados coinciden con el código? |
| **Callbacks** | ¿Los callbacks documentados coinciden con la implementación? |
| **Modelos** | ¿Los modelos asignados coinciden? |

### Paso 3: Clasificar Impacto

**Cambio menor** (actualizar documento sin consultar):
- Cambio de nombre de agente o descripción
- Ajuste de instrucciones sin cambio de responsabilidad
- Cambio de modelo (flash → pro) dentro del mismo agente

**Cambio significativo** (consultar al usuario antes de actualizar):
- Nuevo agente añadido al sistema
- Agente eliminado del sistema
- Cambio de tipo de agente (LlmAgent → SequentialAgent)
- Nueva state key que afecta 2+ agentes
- Cambio en patrón AgentTool ↔ sub_agent

**Cambio estructural** (recomendar nuevo diseño):
- Cambio de patrón de orquestación completo
- Rediseño del flujo de estado
- Más de 3 agentes afectados simultáneamente

### Paso 4: Actualizar Documento de Diseño

Para cambios menores y significativos (tras aprobación):

1. **Actualizar sección de agentes** — añadir/modificar/eliminar fichas de agentes
2. **Actualizar state keys** — sincronizar tabla de keys con la implementación (verificar convención `{agente}_{tipo}`)
3. **Actualizar diagrama de jerarquía** — reflejar nueva estructura
4. **Actualizar evalsets** — verificar que los evalsets existentes siguen siendo válidos tras el cambio
5. **Re-evaluar puntos afectados** del checklist de validación (ver subagent `adk` § Protocolo de Validación Técnica)
6. **Añadir nota de cambio** al final del documento:

```markdown
### Historial de Cambios
- [FECHA]: [Descripción del cambio] — [Justificación]
```

---

## Validación Rápida Post-Cambio

Verificar que el cambio no introdujo violaciones:

- [ ] Ningún agente en `sub_agents` Y `tools` al mismo tiempo
- [ ] Máximo 1 built-in tool por agente
- [ ] Todas las state keys leídas tienen escritores upstream
- [ ] Root agent exportado correctamente (`root_agent`)
- [ ] Sin colisiones de state keys
- [ ] Callbacks con firmas correctas

Si CUALQUIER violación se detecta: **DETENER** y notificar al usuario antes de continuar.

---

## Señales de Alerta

Reportar inmediatamente al usuario si se detecta:

- **State key huérfana**: Key que se escribe pero ningún agente lee
- **Lectura sin escritor**: Agente lee `{key}` que ningún agente escribe
- **Built-in tool duplicada**: Mismo tipo de built-in tool en agente que ya tiene otra
- **God Agent emergente**: Un agente acumulando más de 4 tools o 3 responsabilidades distintas
- **Middleware sin propósito**: Agente que solo pasa resultados sin procesarlos (middleman)
- **Jerarquía profunda**: Más de 3 niveles de anidamiento de agentes
- **Divergencia documento-código**: El documento de diseño ya no refleja la arquitectura real
- **Evalsets desactualizados**: Tests que no cubren agentes nuevos o modificados
- **State keys sin convención**: Keys que no siguen el formato `{agente}_{tipo}` documentado

> Para referencia de patrones y arquitecturas: `ai_docs/refs/adk-samples/`
> Checklist maestro de validación en subagent `adk` § Protocolo de Validación Técnica

---

## Formato de Reporte

Al completar la sincronización, presentar:

```
Sincronización de Arquitectura ADK

Cambio detectado: [descripción breve]
Impacto: [menor | significativo | estructural]
Documento actualizado: ai_docs/tasks/XXX_DESIGN_WORKFLOW_NAME.md

Cambios en documento:
- [sección actualizada]: [qué cambió]

Validación post-cambio: [N/6 checks passed]
Alertas: [lista de alertas, si las hay]
```
