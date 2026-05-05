---
name: generate-diagram
description: "Diagramas Mermaid. Activar proactivamente cuando un diagrama ayudaría a explicar arquitectura, flujos o relaciones, o cuando el usuario pida visualizar, diagramar, 'dibuja', 'esquema de', 'mapa de', 'cómo se relaciona'."
effort: low
---

# Plantilla para Generar Diagramas

> Analiza código o sistemas, genera diagramas Mermaid con documentación, y guarda en `ai_docs/diagrams/`.

---

## Solicitud del Diagrama

| Campo | Valor |
|-------|-------|
| **Titulo** | [Descripción de lo que se diagrama] |
| **Objetivo** | [Qué visualizar y por qué] |
| **Tipo** | flowchart / sequence / class / state / er |

---

## Auto-Numeración y Salida

1. Listar archivos en `ai_docs/diagrams/`, encontrar prefijo `NNN_*.md` más alto
2. Siguiente = más alto + 1 (formato 3 dígitos)

**Archivos:**
- `ai_docs/diagrams/NNN_nombre_descriptivo.md` — diagrama
- `ai_docs/diagrams/NNN_nombre_descriptivo_analysis.md` — análisis

---

## Estilo Requerido

```
classDef primary fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
classDef secondary fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
classDef success fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
classDef warning fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
classDef error fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
```

---

## Tipos de Diagrama

| Tipo | Sintaxis | Ideal Para |
|------|----------|------------|
| Flowchart | `graph TD` | Flujos API, lógica de negocio, árboles de decisión |
| Sequence | `sequenceDiagram` | Interacciones de usuario, comunicaciones API |
| Class | `classDiagram` | Relaciones de componentes, modelos de datos |
| State | `stateDiagram-v2` | Estados de aplicación, estados de proceso |
| ER | `erDiagram` | Relaciones de base de datos, estructuras de datos |

---

## Estructura de Documentación

### Archivo de Diagrama
```markdown
# [Titulo]
## Descripcion General
[Descripcion breve]
## Diagrama
```mermaid
[Código del diagrama]
```
## Componentes Clave
[Roles y relaciones]
## Archivos Relacionados
[Rutas de archivos fuente]
```

### Archivo de Análisis
```markdown
# [Titulo] - Análisis de Flujo
## Resumen del Flujo
## Recorrido Paso a Paso
## Lógica de Decisión
## Manejo de Errores
## Recomendaciones
```
