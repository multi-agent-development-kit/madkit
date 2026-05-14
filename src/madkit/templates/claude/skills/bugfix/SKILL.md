---
name: bugfix
description: "NO para ADK (→ adk-bottleneck-analysis) ni GCP (→ gcp-debugging). Triaje y corrección de bugs. Activar ante errores, fallos, excepciones, 'no funciona', 'se rompe', 'falla', comportamiento inesperado. Regresión obligatoria (→ unit-testing)."
argument-hint: "[descripción del error]"
context: fork
agent: reviewer
effort: high
---

# Plantilla de Triaje y Corrección de Errores

> Triaje rápido primero, investigación profunda solo si es necesario.

---

## PASO 1: Información Crítica (OBLIGATORIO)

- **Mensaje de error:** [Texto exacto]
- **Cuándo ocurre:** [Carga, clic, acción específica]
- **Dónde lo ves:** [Consola, terminal, UI, red]
- **Reproducibilidad:** Siempre / A veces / Condiciones específicas: [describir]

---

## PASO 2: Evaluación Rápida

Clasificar como:
- **Corrección Simple** — typo, sintaxis, obvio de una línea → arreglar ahora
- **Archivo/Import Faltante** — 404, import error → verificar existencia y dependencias
- **Problema de Tipo/Interface** — errores TS, datos incorrectos → verificar definiciones de tipo
- **Entorno/Configuración** — API keys, DB, env vars → verificar ajustes
- **Problema Complejo** → continuar a Investigación Profunda

---

## INVESTIGACIÓN PROFUNDA (Solo para Problemas Complejos)

### Análisis de Causa Raíz

Trazar el flujo: `Acción Usuario → Componente A → Función B → Servicio C → PUNTO DE ERROR`. Para cada nodo: estado/datos esperados vs reales. Determinar punto de quiebre y causa raíz de la divergencia.

### Análisis de Soluciones

Evaluar 2 opciones: **Fix Dirigido** (mínimo, menor riesgo) y **Fix Sistemático** (arquitectónico, mayor alcance). Para cada una: qué resuelve · cómo · riesgo (Bajo/Medio/Alto). Recomendar con razonamiento.

**Si fix complejo (3+ líneas o múltiples archivos):** Escalar a `task-planner` que cargará la reference correspondiente al stack (`references/task_template_<stack>.md`).

---

## PASO 3: Test de Regresión (OBLIGATORIO)

> Protocolo completo, taxonomía de doubles y patrones por stack: skill `unit-testing`.

1. Escribir test que REPRODUCE el bug → ejecutar → DEBE FALLAR (RED)
2. Aplicar fix mínimo → ejecutar → DEBE PASAR (GREEN)
3. Ampliar: boundary + corner cases cercanos al bug
4. **Comentario grep-able obligatorio:** cada test de regresión incluye comentario indicando el task de origen, así futuras búsquedas anti-regresión son grep-ables. Variantes por lenguaje:

   | Lenguaje | Sintaxis | Ejemplo |
   |---|---|---|
   | TypeScript / JavaScript / Java / C / Go | `// Regresión: task NNN` | `// Regresión: task 087 — auth con email vacío` |
   | Python / Ruby / Shell | `# Regresión: task NNN` | `# Regresión: task 092 — race condition en signal cascade` |
   | HTML / XML | `<!-- Regresión: task NNN -->` | `<!-- Regresión: task 056 — encoding UTF-16 BOM -->` |
   | SQL | `-- Regresión: task NNN` | `-- Regresión: task 099 — null en columna NOT NULL tras migración` |

   Búsqueda futura: `grep -r "Regresión: task NNN"` localiza todos los tests anti-regresión asociados a un task histórico.

**Sin infraestructura de testing →** activar la skill `testing-setup` primero.
