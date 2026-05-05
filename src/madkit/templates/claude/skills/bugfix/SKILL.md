---
name: bugfix
description: "Triaje y corrección de bugs. Activar proactivamente ante errores, fallos, excepciones, 'no funciona', 'se rompe', 'falla', 'está roto', 'problema con', comportamiento inesperado. Regresión obligatoria (→ unit-testing). NO para ADK (adk-bottleneck-analysis) ni GCP (gcp-debugging)."
argument-hint: "[descripción del error]"
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

**Análisis de Flujo:**
```
[Acción Usuario] -> [Componente A] -> [Función B] -> [Servicio C] -> [PUNTO DE ERROR]
                      |               |               |
                [Estado Esperado] [Datos Esperados] [Resultado Esperado]
                      |               |               |
                [Estado Real]   [Datos Reales]   [Resultado Real]
```

**Análisis de Discrepancia:**
- **Comportamiento esperado:** [qué debería pasar]
- **Comportamiento real:** [qué realmente pasa]
- **Punto de quiebre:** [dónde comienza la divergencia]
- **Causa raíz:** [por qué ocurre la divergencia]

### Análisis de Soluciones

#### Opción 1: [Fix Dirigido]
- **Qué:** [Descripción breve]
- **Cómo:** [Pasos de implementación]
- **Resultados de investigación:** [Qué reveló el análisis]
- **Pros/Contras/Riesgo:** [Bajo / Medio / Alto]

#### Opción 2: [Fix Sistemático]
- **Qué:** [Descripción breve]
- **Cómo:** [Pasos de implementación]
- **Resultados de investigación:** [Qué mostró el análisis arquitectónico]
- **Pros/Contras/Riesgo:** [Bajo / Medio / Alto]

### Solución Recomendada

**RECOMENDADO:** [Opción X] porque [razonamiento basado en análisis]

**SI ES FIX COMPLEJO (3+ líneas o múltiples archivos):** Escalar a plantilla de tarea:
- TypeScript/Next.js: `task_template_typescript.md`
- Python: `task_template_python.md`

---

## PASO 3: Test de Regresión (OBLIGATORIO)

> Protocolo completo, taxonomía de doubles y patrones por stack: skill `unit-testing`.

1. Escribir test que REPRODUCE el bug → ejecutar → DEBE FALLAR (RED)
2. Aplicar fix mínimo → ejecutar → DEBE PASAR (GREEN)
3. Ampliar: boundary + corner cases cercanos al bug

**Sin infraestructura de testing →** ejecutar `/testing_setup` primero.
