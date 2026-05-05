---
name: diff
description: "Análisis de cambios y diffs legibles. Activar proactivamente tras múltiples ediciones, cuando el usuario pregunte 'qué cambié', 'qué he tocado', 'resumen de cambios', 'qué se ha modificado'. Skill auxiliar — no gestiona commits ni PRs."
effort: low
---

# Resumen de Diff y Análisis de Cambios

> Analiza cambios de código, genera diffs legibles antes/después, y proporciona resúmenes proporcionales.

---

## Detección de Cambios

### Modo Predeterminado: Contexto de Conversación
Revisar historial para invocaciones Edit/Write → compilar lista de archivos modificados.

### Modo Expandido: Git Status
Activado cuando el usuario dice "todos los cambios", "mostrar todo" o "diff completo":
- `git status` + `git diff` + `git diff --staged`
- Notar en resumen que incluye cambios no-IA

Si no hay cambios en conversación ni solicitud expandida: reportar "No se detectaron cambios".

---

## Formato de Diff

Para cada archivo modificado:

```markdown
### path/to/file.ts

**Resumen:** [escalado según tabla abajo]

**Cambios:**
-- Antes (líneas 15-22) ------------------------------------
| 15 | const handleSubmit = async (e: FormEvent) => {
| 16 |   e.preventDefault()
| 17 |
| 18 |   const result = await signIn(email, password)
| 19 |   if (result.error) {
| 20 |     setError(result.error)
| 21 |   }
| 22 | }
------------------------------------------------------------

-- Después (líneas 15-30) ------------------------------------
| 15 | const handleSubmit = async (e: FormEvent) => {
| 16 |   e.preventDefault()
| 17 |   setError('')
| 18 |
| 19 |   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
| 20 |   if (!emailRegex.test(email)) {
| 21 |     setError('Please enter a valid email address')
| 22 |     return
| 23 |   }
| 24 |
| 25 |   const result = await signIn(email, password)
| 26 |   if (result.error) {
| 27 |     setError('Invalid email or password. Please try again.')
| 28 |   }
| 29 | }
------------------------------------------------------------

**Impacto:** Modificado | [+8 líneas, -0 líneas]
```

- Incluir números de línea, 2-3 líneas de contexto arriba/abajo
- Agrupar cambios relacionados dentro del mismo archivo

---

## Escalamiento de Resumen

| Líneas Modificadas | Longitud del Resumen |
|--------------------|----------------------|
| 1-10 | 1 oración |
| 11-50 | 2 oraciones (qué + por qué) |
| 51-200 | 3 oraciones (qué + por qué + impacto) |
| 200+ | 4 oraciones (vista general comprehensiva) |

Enfocarse en propósito, voz activa, referenciar componentes/funciones reales.
