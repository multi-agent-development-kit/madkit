# Plantilla de Tarea de IA para Python

> **Instrucciones:** Esta plantilla crea documentos de tareas del tamaño apropiado para desarrollo Python con IA. **Lee PRIMERO la clasificacion de complejidad a continuacion** para evitar documentos innecesariamente verbosos.
>
> **Cabecera de Metadatos opcional (T079):** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Ver documentación completa en [`task_template.md`](task_template.md) §"Cabecera de Metadatos del Task Doc (opcional)" — esta plantilla hereda esa especificación.

---

## CRÍTICO: Protocolo de Creación de Documentos de Tarea

### COMPORTAMIENTO OBLIGATORIO

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementar cambios directamente.**

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoría de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa secciones 1,4,10,11 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambios afectan <=2 archivos
- Sin nuevas clases/funciones (solo modificaciones)
- Sin cambios de schema de base de datos
- Sin nuevas dependencias
- Requisitos claros e inequívocos

**Ejemplos:**
- Corregir typo o nombre de variable de entorno
- Agregar sentencia de logging o cambiar valor por defecto
- Modificar parametro de configuración existente
- Corregir validación de entrada en funcion existente

### TAREA ESTÁNDAR (Usa secciones 1,3,4,6,8,10,11,12,15 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Cambios afectan 3-6 archivos
- Agregar nuevas funciones/clases
- Cambios de schema de base de datos
- Nuevas dependencias requeridas
- Algunas decisiones de arquitectura

**Ejemplos:**
- Nuevo endpoint API con consulta de base de datos
- Integración de API de terceros con manejo de errores
- Nueva tabla de base de datos con modelo y migración
- Implementar capa de cache para servicio existente

### TAREA COMPLEJA (Usa todas las secciones - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Cambios afectan 7+ archivos
- Creación de nuevo servicio/modulo
- Cambios breaking en APIs publicas
- Multiples nuevas dependencias
- Cambios mayores de arquitectura

**Ejemplos:**
- Pipeline de datos multi-etapa con validación
- Sistema de autenticacion completo desde cero
- Comunicacion WebSocket con manejo de estado
- Migracion de base de datos con transformacion de datos

### TAREA CRÍTICA (Usa todas las secciones + plan de rollback obligatorio - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Cambios en schema de tablas con >100K filas
- Migraciones de datos en producción
- Cambios en backend de autenticacion
- Cambios de backend/motor de base de datos
- Operaciones multi-base de datos
- Cambios que afectan disponibilidad del servicio

**Ejemplos:**
- Alterar tipo de campo en tabla con millones de filas
- Migrar de SQLite a PostgreSQL en producción
- Cambiar backend de autenticacion (session → JWT)
- Dividir monolito en microservicios

---

## 0. Triaje de Ingeniería (OBLIGATORIO ANTES de crear documento)

<!-- AI Agent: Esta fase se ejecuta ANTES de crear el documento de tarea. Para tareas SIMPLE (<=2 archivos), el triaje es mental. Para ESTÁNDAR+, es explícito y se comunica al usuario. -->

**DETENER. No crear documento de tarea sin completar este triaje.**

### T1: Analizar — Examinar el codebase ANTES de planificar

Antes de documentar nada, examinar el proyecto para responder:

**Radio de impacto:**
- ¿Cuántos servicios, repositorios, modelos, endpoints y archivos de configuración se ven afectados?
- Esto determina la complejidad REAL (no la intuida por la descripción del usuario)

**Prerequisitos:**
- ¿Qué debe existir para que esto funcione? Trazar dependencias hacia atrás (max 2 niveles)
- Marcar cada prerequisito: ✅ existe | ❌ falta (bloqueante)
- Verificar: entorno virtual, dependencias, framework configurado, servicios necesarios
- Si hay prerequisitos bloqueantes → son tareas separadas que deben resolverse primero

**Integración:**
- ¿Cómo se conecta con lo existente? ¿Hay patrones de servicios/repositorios establecidos?
- ¿Nuevo servicio o extender existente? ¿Hay código reutilizable?

**Estado del codebase:**
- ¿Hay deuda técnica, errores mypy, o conflictos de dependencias que afecten?

### T2: Cuestionar — Solo si el análisis revela algo relevante

El agente NO cuestiona por cuota. Cuestiona cuando T1 revela algo que el usuario no ha considerado:

- **Alcance excesivo:** La petición cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas con dependencias claras
- **Enfoque subóptimo:** Existe una solución más simple en el codebase o el framework → proponerla (ej: ¿nuevo servicio o extender existente? ¿sync o async?)
- **Prerequisitos bloqueantes:** Falta infraestructura o código que son tareas en sí mismos → proponer crearlos primero
- **Viabilidad técnica:** El enfoque pedido tiene problemas técnicos concretos → advertir y proponer alternativa
- **Sobre-diseño:** Se está creando complejidad innecesaria para el caso de uso real → proponer simplificación KISS

**Si no hay nada que cuestionar:** Pasar directo a T3. No fabricar objeciones.

### T3: Alinear — Validar alcance con el usuario antes de documentar

Presentar al usuario un resumen del alcance antes de crear el documento:

```
Alcance: [1-2 frases de qué se va a hacer]
Complejidad: [SIMPLE|ESTÁNDAR|COMPLEJA|CRÍTICA] — basada en ~N archivos, M módulos
Prerequisitos: [lista si hay] / Ninguno detectado
[Solo si hubo negociación en T2] Fuera de alcance: [qué queda fuera y por qué]
[Solo si T2 detectó algo] Observación: [hallazgo relevante]

¿Confirmas para crear el documento de tarea?
```

**Para tareas SIMPLE:** T3 se integra con la presentación final — no hay dos puntos de espera.
**Para ESTÁNDAR+:** T3 es un punto de espera explícito antes de crear el documento.

---

## 0.1. Validación Pre-Vuelo (OBLIGATORIA)

DETENER. NO proceder si CUALQUIER validación falla. Resolver TODOS los fallos antes de continuar.

---

### 0.1.1 Acceso al Sistema de Archivos

- [ ] Directorio de trabajo actual es accesible con permisos de lectura/escritura
- [ ] El directorio `ai_docs/` existe (o anotar para creación en Paso 0.7)
- [ ] El directorio `ai_docs/tasks/` existe (o anotar para creación en Paso 0.7)

---

### 0.1.2 Entorno Python

- [ ] Python 3.10+ instalado y accesible
- [ ] Entorno virtual existe y esta activo (verificar `$VIRTUAL_ENV`)
- [ ] Gestor de paquetes detectado (uv / poetry / pip) con lock file identificado

---

### 0.1.3 Detección de Framework y Stack

- [ ] Versión patch de Python registrada (ej., 3.11.5)
- [ ] Framework detectado desde pyproject.toml/requirements.txt (Django / FastAPI / Flask / None)
- [ ] Paquetes de base de datos identificados (SQLAlchemy, psycopg2, asyncpg, etc.)
- [ ] Soporte async evaluado (asyncio, uvloop, clientes HTTP async)

**Referencia de Versiones de Framework:**

| Framework | Python Requerido | Soporte Async | ORM de Base de Datos |
|-----------|-----------------|---------------|---------------------|
| Django 6.0 | >= 3.12 | ASGI + background tasks nativo | Django ORM |
| Django 5.2 LTS | >= 3.10 | ASGI (async) | Django ORM |
| FastAPI 0.135+ | >= 3.9 | Nativo (async) | SQLAlchemy 2.0 |
| Flask 3.0+ | >= 3.10 | Async agregado | SQLAlchemy 2.0 |

---

### 0.1.4 Herramientas de Desarrollo

- [ ] Linter/formateador disponible: ruff (preferido) / black / flake8
- [ ] Verificador de tipos disponible: mypy (establecido) / ty (Astral, más rápido) / pyright
- [ ] Framework de pruebas disponible: pytest (preferido) / unittest
- [ ] Todas las herramientas ejecutables via `python -m` o comando directo

**Stack moderno recomendado:** pytest + ruff (linter+formateador) + mypy o ty (verificación de tipos)

---

### 0.1.5 Configuración de Dependencias

- [ ] Archivo de dependencias existe (pyproject.toml preferido > setup.py > requirements.txt)
- [ ] Dependencias instaladas en entorno virtual
- [ ] Modulos clave pueden importarse sin errores
- [ ] Sin conflictos de version detectados (`pip check` o `uv pip check`)

---

### 0.1.6 Detección de Estado del Proyecto

**Preguntar explicitamente si no esta claro:**
1. Este sistema procesa datos de producción de usuarios reales? [Si/No]
2. Hay usuarios activos que dependen de este sistema? [Si/No]
3. Hay código existente que debe preservarse? [Si/No]

**Determinacion:**
- **Greenfield:** Todo "No" -- usar mejores prácticas modernas, empezar desde cero
- **Brownfield:** Cualquier "Si" -- usar enfoque incremental, compatible hacia atras
- **Hibrido:** Mixto -- balancear prácticas modernas con preservacion

---

### 0.1.7 Nomenclatura de Archivos de Tarea

- [ ] Proyecto confirmado como Python (pyproject.toml, archivos *.py presentes)
- [ ] Convencion de nomenclatura: `XXX_snake_case_name.md` (estandar Python PEP 8)
- [ ] Tareas existentes en `ai_docs/tasks/` siguen este patrón

NOTA: Si el proyecto no es Python, usar la plantilla apropiada (task_template.md para TypeScript, task_template_php.md para PHP, task_template_adk.md para ADK).

---

### Validación Pre-Vuelo Completa

Todas las verificaciones pasan: Proceder al Paso 0.8 (Verificar Estructura del Proyecto).

---

### Paso 0.8: Verificar Estructura del Proyecto

Confirmar que los directorios `ai_docs/` y `ai_docs/tasks/` existen.

**Si no se encuentran:** DETENER y preguntar al usuario: "No veo un directorio `ai_docs/`. Debo crearlo?"

---

### Paso 0.9: Verificar Documento de Tarea Activa

Antes de crear una nueva tarea:

1. Listar archivos en `ai_docs/tasks/` y buscar un documento relacionado con la solicitud actual
2. Si el usuario pide correcciones/revisiones/continuacion -- buscar y ACTUALIZAR el documento existente
3. **Solo crear un nuevo número de tarea si es trabajo GENUINAMENTE NUEVO**

Si se encuentra tarea activa: Saltar al Paso 0.12 (Manejar Retroalimentacion) y trabajar sobre el documento existente.

---

### Paso 0.10: Detectar Siguiente Número de Tarea

**Solo si el Paso 0.9 confirmo que no aplica ninguna tarea existente:**

1. Listar archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de cada nombre de archivo
3. Encontrar el número mas alto, sumar 1, formatear con 3 dígitos
4. Si no hay archivos: usar 001

**Reglas:**
- Secuencia global compartida (nunca reiniciar por tipo)
- Siempre 3 dígitos: 001, 042, 156
- Cada número usado EXACTAMENTE UNA VEZ -- un número, un archivo

---

### Paso 0.11: Crear Documento de Tarea

CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo.

**Nomenclatura:** `ai_docs/tasks/XXX_snake_case_name.md`

**Estructura:**
1. Llenar secciones basadas en clasificacion de complejidad (SIMPLE/ESTÁNDAR/COMPLEJO)
2. Incluir análisis estrategico si los criterios de complejidad se cumplen
3. Proveer fases de implementación con ejemplos antes/despues
4. Definir criterios de éxito claros

---

### Paso 0.12: Presentar Documento de Tarea al Usuario

<!-- El análisis crítico (dependencias, prerequisitos, viabilidad, alternativas) ya se realizó en el Triaje de Ingeniería (T1-T2-T3). Este paso presenta el documento ya validado. -->

Presentar estas 3 opciones:

```
Documento de Tarea Creado: `ai_docs/tasks/XXX_snake_case_name.md`

Resumen del Enfoque Planificado:
[Resumen breve de 2-3 oraciones]

Observaciones y Sugerencias del Asistente:
Tras analizar la tarea y el codebase, he identificado lo siguiente:

1. **[Categoría]:** [Observación o sugerencia concreta]
2. **[Categoría]:** [Observación o sugerencia concreta]
3. **[Categoría]:** [Observación o sugerencia concreta — si aplica]

> Categorías válidas: Dependencia detectada | Prerequisito | Alternativa de enfoque | Optimización | Riesgo identificado | Ajuste de alcance | Refactorización recomendada

Como deseas proceder?

A) Vista Previa de Cambios de Codigo Detallados
Mostrar ejemplos específicos antes/despues y modificaciones de archivos.

B) Aprobar e Iniciar Implementación
Comenzar implementación fase por fase con seguimiento de progreso.

C) Modificar o Iterar sobre el Plan
Ajustar el enfoque, explorar las sugerencias, o refinar el plan antes de comprometerse.
```

PUNTO DE ESPERA OBLIGATORIO:
- DETENER aqui y esperar eleccion explicita del usuario (A, B o C)
- NO asumir aprobación ni elegir opcion por defecto
- NO iniciar implementación sin respuesta explicita "B" o "Aprobado"

**NOTA SOBRE ITERACIÓN:** La iteración es el proceso normal. Las tareas raramente están perfectas en la primera versión. Si el usuario elige C, actualizar el documento existente, incorporar el feedback, y re-presentar con nuevas sugerencias basadas en la conversación.

---

### Paso 0.12b: Manejar Retroalimentacion y Actualizaciones del Usuario

Si el usuario elige Opcion C o solicita cambios:

- Leer documento de tarea actual e identificar secciones que necesitan modificacion
- Editar el archivo EXISTENTE in-place -- NUNCA crear variantes `_v2`, `_updated`, `_revised`
- Agregar notas de revisión con timestamps en secciones relevantes

---

## ACCIONES PROHIBIDAS

### NO HACER:
1. Modificar archivos de plantilla en `.claude/commands/`
2. Crear multiples versiones de documentos de tarea (`_v2`, `_updated`, `_final`)
3. Crear nuevas carpetas ai_docs en subdirectorios o ubicaciones diferentes
4. Saltar secuencia de números de tarea o reiniciar numeracion
5. Crear archivos de resumen/reporte separados del documento de tarea
6. Crear multiples archivos con el mismo número de tarea
7. Implementar sin aprobación -- siempre esperar eleccion explicita del usuario
8. Asumir la estructura del proyecto -- siempre verificar que los directorios existen primero

### REGLA DE DOCUMENTO UNICO (ABSOLUTA):
- UN número de tarea = UN archivo. Punto.
- Correcciones, progreso de implementación, revisiones, sub-reportes -- todo va en el MISMO archivo

### CONDICIONES DE PARADA DE EMERGENCIA:
- A punto de modificar un archivo de plantilla -- DETENER y advertir al usuario
- A punto de crear `ai_docs_v2/` o similar -- DETENER y usar `ai_docs/` existente
- A punto de crear un segundo archivo con un número de tarea existente -- DETENER y editar archivo existente

---

## Sección de Seguimiento del Ciclo de Vida de Tarea

Agregar esta sección a cada documento de tarea creado:

```markdown
---

## Seguimiento del Ciclo de Vida de Tarea

### Creación
- **Creado:** [timestamp]
- **Creado Por:** task_template_python.md
- **Número de Tarea:** [XXX]
- **Complejidad Inicial:** [Simple | Estandar | Complejo]

### Revisiones
- [Fecha]: [Que cambio y por que]

### Progreso de Implementación

### Estado de Finalización
- **Estado:** [Planificación | En Progreso | Pending Review | Completado | Bloqueado]
- **Ultima Actualización:** [timestamp]

---
```

---

## 1. Resumen de Tarea

### Titulo de Tarea
**Titulo:** [Titulo breve y descriptivo de lo que se construye/corrige]

### Declaracion de Objetivo
**Objetivo:** [Declaracion clara de lo que se quiere lograr y por que importa]

---

## 2. OBLIGATORIO: Análisis de Codebase Existente (OMITIR para Tareas Simples)

**USAR:** Nuevas funcionalidades, codebase no familiar, cambios multi-servicio, integraciones complejas
**OMITIR:** Cambios de configuración, actualizaciones de un solo archivo, correcciones simples de bugs

### PROTOCOLO DE ANALISIS ESTRUCTURADO DE CODEBASE

CRÍTICO: Completar ESTE protocolo COMPLETO antes de cualquier planificacion o implementación. DETENER si alguna fase no puede completarse -- NO adivinar ni asumir.

---

**FASE 1: Descubrimiento de Servicios Relacionados** (10 minutos)

**Paso 1.1:** Generar terminos de busqueda basados en tu tarea
```python
# Ejemplo: "agregar procesamiento de video" -> ["video", "media", "process", "upload", "file"]
```

**Paso 1.2:** Buscar archivos que coincidan con esos terminos y contengan definiciones de clase "Service".

**Paso 1.3:** Para cada archivo de servicio descubierto, documentar:
```python
# Service: VideoProcessingService
# File: src/services/video_processing_service.py
# Lines: 245
# Purpose: [Del docstring]
# Key Methods:
#   - process_video(file_path: str) -> Dict: [que hace]
#   - validate_format(file: UploadFile) -> bool: [que hace]
# Dependencies: ffmpeg, google-cloud-storage
# State: ACTIVE / DEPRECATED / INCOMPLETE
# Reusability: CAN_EXTEND / CREATE_NEW / NEEDS_REFACTOR
```

---

**FASE 2: Matriz de Decisión de Integración** (5 minutos)

| Criterio | Puntuacion | Notas |
|----------|-----------|-------|
| Funcionalidad similar existe | 0-5 | [0=ninguna, 5=coincidencia exacta] |
| Archivo de servicio <200 líneas | SI/NO | [Conteo de líneas actual] |
| Servicio se mantiene activamente | SI/NO | [Fecha de ultima modificacion] |
| Workflow encaja naturalmente | 0-5 | [0=forzado, 5=natural] |
| Dependencias diferentes necesarias | SI/NO | [Listar nuevas deps] |
| Dominio completamente diferente | SI/NO | [Evaluación] |

**Calculo:**
- Extender existente: Similaridad>=3 + Tamano=SI + Encaja>=3 + Mantenido=SI
- Crear nuevo: Similaridad<=2 O Tamano=NO O Deps_diferentes=SI O Dominio_diferente=SI

**DECISION:**
```markdown
DECISION: [EXTENDER service_name.py / CREAR NUEVO service_name.py]

JUSTIFICACION:
- [Razón específica 1]
- [Razón específica 2]

ARCHIVOS A MODIFICAR: [Lista]
ARCHIVOS NUEVOS NECESARIOS: [Lista]
DEPENDENCIAS A AGREGAR: [Lista]
```

---

**CHECKLIST DE FINALIZACION** (TODOS deben estar marcados antes de proceder):
- [ ] Fase 1: Estructura del proyecto documentada
- [ ] Fase 2: Servicios relacionados descubiertos y analizados
- [ ] Fase 3: Workflow actual mapeado
- [ ] Fase 4: Decisión de integración tomada con justificacion
- [ ] Sin suposiciones -- todos los datos de lecturas reales de archivos

DETENER: Si CUALQUIER checkbox esta sin marcar, NO proceder a planificacion de implementación.

#### Análisis de Definicion de Funciones (CRÍTICO)

OBLIGATORIO: Inspeccionar firmas reales de funciones antes de implementar.

**Paso 1: Localizar Definicion de Funcion**
Opciones: IDE "Ir a Definicion", busqueda en codebase, inspeccion de paquete, docs online.

**Paso 2: Extraer Detalles de Firma**
```python
# Function: create_content
# Module: google.generativeai.types
# Signature: def create_content(parts: list[Part | str], role: str = "user") -> Content
# Required imports: from google.generativeai.types import Content, Part
# Parameter details:
#   - parts: DEBE ser lista de objetos Part, NO dicts
#   - role: String opcional, default "user"
# Returns: Content object
```

**Paso 3: Verificar que imports funcionan**
**Paso 4: Probar llamada a funcion con ejemplo minimo**

DETENER: NO escribir código usando la funcion hasta que los 4 pasos esten completos.

#### Decisión de Integración vs Codigo Nuevo

**EXTENDER SERVICIO EXISTENTE CUANDO:**
- Funcionalidad similar ya existe
- Workflow encaja naturalmente en pipeline existente
- Mantiene consistencia con patrones establecidos

**CREAR NUEVO SERVICIO CUANDO:**
- Funcionalidad es completamente diferente
- Nuevo servicio seria reutilizable entre workflows
- Servicios existentes ya son complejos
- Dependencias/patrones diferentes requeridos

**RESULTADOS DEL ANALISIS:**
- **Servicios Relacionados Existentes:** [Lista]
- **Workflow Actual:** [Descripción]
- **Decisión de Integración:** [Extender/Crear con justificacion]
- **Punto de Entrada Recomendado:** [Cual metodo/servicio modificar]

### Stack Tecnologico Existente
- **Versión de Python:** [De pyproject.toml]
- **Framework Principal:** [FastAPI, Flask, etc.]
- **Base de Datos:** [PostgreSQL, SQLite, etc.]
- **Servicios AI/ML Existentes:** [Lista]
- **Patrónes de Autenticacion:** [Como se autentican los servicios]
- **Pipeline de Procesamiento:** [Como se procesan los datos]

### REQUISITOS DE INTEGRACION
- **Archivos a Modificar:** [Archivos existentes específicos]
- **Archivos Nuevos Necesarios:** [Solo si realmente necesario]
- **Dependencias a Agregar:** [Solo si las existentes no pueden manejar]
- **Migracion Necesaria:** [Si código existente necesita actualización]

---

## 3. Análisis de Alternativas de Implementación

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, documentar brevemente por que solo hay un enfoque viable.**

> Despues de analizar el codebase, explorar MULTIPLES enfoques ANTES de comprometerse con uno. El objetivo es evitar descubrir mejores alternativas cuando ya se ha implementado la mitad.

### Criterio de Activacion

Realizar análisis completo si se cumplen 2+ criterios:
- [ ] Multiples enfoques: 3+ soluciones técnicas distintas existen
- [ ] Variacion significativa de tiempo: >50% diferencia entre enfoques
- [ ] Compromisos medibles: >20% diferencia en rendimiento, costo o mantenibilidad
- [ ] Restricciones permanentes: La decisión crea lock-in a largo plazo
- [ ] Amplio impacto en sistema: Cambios afectan 3+ servicios

### Contexto del Problema
[Explicar por que se deben considerar multiples soluciones]

### Análisis de Alternativas de Solución

#### Alternativa 1: [Nombre de Solución]
**Enfoque:** [Descripción]
**Pros:** [Lista]
**Contras:** [Lista]
**Complejidad de Implementación:** [Baja/Media/Alta]
**Nivel de Riesgo:** [Bajo/Medio/Alto]

#### Alternativa 2: [Nombre de Solución]
**Enfoque:** [Descripción]
**Pros:** [Lista]
**Contras:** [Lista]
**Complejidad de Implementación:** [Baja/Media/Alta]
**Nivel de Riesgo:** [Bajo/Medio/Alto]

### Matriz de Compromisos

| Factor | Alternativa 1 | Alternativa 2 | Alternativa 3 | Ganador |
|--------|----------|----------|----------|---------|
| **Complejidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Rendimiento** | B/M/A | B/M/A | B/M/A | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Escalabilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Deuda Tecnica** | B/M/A | B/M/A | B/M/A | [ ] |

### Recomendacion y Justificación

SOLUCIÓN RECOMENDADA: Alternativa [X] - [Nombre]

**Por que:**
1. [Razón principal]
2. [Razón secundaria]
3. [Consideracion a largo plazo]

**Alternativas Rechazadas:**
- Alternativa [Y]: Rechazada porque [razón concreta, no "es peor"]

### DECISION DEL USUARIO REQUERIDA

Presentar las alternativas al usuario con la recomendacion. Esperar aprobación antes de proceder.

---

---

## 5. Contexto del Proyecto y Enfoque de Desarrollo

### OBLIGATORIO: Detectar Etapa del Proyecto

**PROYECTO GREENFIELD** (Desarrollo nuevo):
- Codebase inicializado recientemente (< 6 meses)
- Sin usuarios de producción, datos minimos/inexistentes
- Fase de desarrollo activo

**PROYECTO BROWNFIELD** (Sistema establecido):
- Sistema de producción existente con usuarios activos
- Datos de producción que no pueden perderse
- Codigo legacy o dependencias no documentadas

**Detección:** Verificar configs de despliegue, funcionalidades orientadas al usuario, base de datos, historial git. Preguntar al usuario si hay duda.

---

### Enfoque de Desarrollo por Etapa del Proyecto

#### Para Proyectos GREENFIELD

**Principio:** *"Moverse rapido, iterar, priorizar aprendizaje sobre preservacion"*

- Cambios breaking en APIs aceptables
- Cambios de schema sin migraciones complejas
- Refactorizacion y reestructuracion agresiva
- Datos pueden borrarse y regenerarse
- **Corregir problemas de raiz, no parchearlos**
- **Si el código esta ROTO, CORREGIRLO** -- no mantener contratos rotos
- **Si los nombres son INCORRECTOS, CAMBIARLOS** -- no transformar entre formatos

---

#### Para Proyectos BROWNFIELD

**Principio:** *"No romper nada. Análisis exhaustivo antes de cada cambio."*

- Análisis exhaustivo de dependencias antes de CUALQUIER cambio
- Backups completos antes de modificaciones
- Pruebas de regresion comprensivas
- Planes de rollback para todos los cambios
- Estrategias de migración cuidadosas

---

#### Proyectos HIBRIDOS

- Codigo existente/producción: enfoque brownfield
- Nuevas funcionalidades aisladas: enfoque greenfield
- Puntos de integración: enfoque brownfield (proteger existente)

---

### Documentacion de Contexto del Proyecto

```markdown
## Contexto del Proyecto

**Etapa del Proyecto**: [Greenfield / Brownfield / Hibrido]
**Evidencia**: [Que indica esta etapa]
**Enfoque de Desarrollo**: [Iteracion rapida / Preservacion cuidadosa / Mixto]

**Restricciones**:
- Compatibilidad hacia atras: [Requerida / No requerida]
- Preservacion de datos: [Critica / Puede regenerarse]
- Cambios breaking: [Aceptables / Prohibidos]
- Profundidad de pruebas: [Basica / Regresion exhaustiva]
```

CRÍTICO: En caso de duda, usar enfoque brownfield.

---

---

## 7. Datos y Cambios de Base de Datos (OMITIR si no hay cambios de base de datos)

**USAR:** Cambios de schema, nuevas tablas, migraciones de datos, actualizaciones de modelos
**OMITIR:** Sin involucramiento de base de datos

### Cambios de Schema de Base de Datos
```sql
-- Sentencias DDL, migraciones, indices
```

### Actualizaciones de Modelo de Datos
```python
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NewDataModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    name: str
    created_at: datetime
```

### Plan de Migracion de Datos
- [ ] Cambios de schema
- [ ] Transformacion de datos
- [ ] Estrategia de validación y rollback

---

## 8. Cambios de API y Backend (OMITIR para cambios solo internos)

**USAR:** Nuevos endpoints API, integraciones externas, interfaces de servicio
**OMITIR:** Cambios internos de código, actualizaciones de configuración

### Patrón de Acceso a Datos - REGLAS CRÍTICAS DE ARQUITECTURA

**RUTAS API** -> `main.py` o `routers/[feature].py`
- [ ] Rutas FastAPI con metodos HTTP apropiados y validación Pydantic

**LOGICA DE NEGOCIO** -> `services/[feature].py`
- [ ] Capa de servicio separada de rutas, mantener rutas delgadas

**ACCESO A BASE DE DATOS** -> `repositories/[feature].py`
- [ ] Patrón repositorio, connection pooling, async cuando sea posible

### Endpoints API
- [ ] **`POST /api/[resource]`** - [Crear]
- [ ] **`GET /api/[resource]/{id}`** - [Leer]
- [ ] **`PUT /api/[resource]/{id}`** - [Actualizar]
- [ ] **`DELETE /api/[resource]/{id}`** - [Eliminar]

### Integraciones Externas
- [Servicio 1: Propósito y configuración]
- [Servicio 2: Autenticacion y limitacion de tasa]

---

## 9. Organizacion de Codigo y Estructura de Archivos (OMITIR para cambios de archivo único)

**USAR:** Cambios multi-archivo, nuevos modulos, reestructuracion
**OMITIR:** Modificaciones de archivo único, cambios de configuración

### Archivos Nuevos a Crear
```
project-root/
    [feature_name]/
        __init__.py
        models.py        # Modelos Pydantic
        services.py      # Logica de negocio
        repository.py    # Acceso a base de datos
        router.py        # Rutas FastAPI
    utils/
        database.py
        exceptions.py
    main.py
```

### Archivos a Modificar
- [ ] **`main.py`** - [Registro de rutas]
- [ ] **`config.py`** - [Nuevas configuraciones]
- [ ] **`pyproject.toml`** - [Nuevas dependencias]

### Requisitos de Patrón de Imports
CRÍTICO:
- **Imports relativos** dentro del mismo paquete: `from .models import MyModel`
- **Imports absolutos** solo para paquetes externos: `from fastapi import FastAPI`
- **NUNCA** imports absolutos para modulos internos

### Dependencias a Agregar
CRÍTICO: Usar comandos uv, nunca pip install directamente.
OBLIGATORIO: Investigar versiones mas recientes antes de agregar.

```toml
[project.dependencies]
"new-package>=X.Y.Z"  # Usar version mas reciente real

# Paquetes modernos de Google AI UNICAMENTE:
# Verificar últimas versiones antes de instalar:
# uv pip index versions vertexai
# uv pip index versions google-genai
"vertexai>=1.38.0"     # Para Vertex AI - verificar ultima version
"google-genai>=1.24.0" # Para Generative AI - verificar ultima version
# NUNCA usar: "google-cloud-aiplatform" - DEPRECADO
```

---

## 10. Reglas Específicas del Proyecto

**CRÍTICO: Usar comandos `uv`, NUNCA `pip install` directamente.**

**Prohibiciones:**
- `Any` como type hint — usar tipos específicos siempre
- Imports absolutos dentro del paquete — usar imports relativos
- `google-cloud-aiplatform` en pyproject.toml — DEPRECADO, usar `google-genai`

**Validación obligatoria:**
```bash
uv run ruff check .
uv run pytest
```

---

## 11. Plan de Implementación

### Fase 1: [Nombre de Fase]
**Objetivo:** [Que logra esta fase]

**Subtareas:**
- [ ] **Tarea 1.1:** [Tarea específica con rutas de modulos]
  - Archivos: `[feature]/models.py`, `[feature]/services.py`
  - Detalles: [Especificos técnicos]
  - **Completado Cuando**: [Archivo existe Y funcion implementada Y pasa mypy]
- [ ] **Tarea 1.2:** [Otra tarea]
  - Archivos: [Modulos afectados]
  - Detalles: [Enfoque de implementación]
  - **Completado Cuando**: [Estado de finalizacion medible]

**Criterios de Finalización Fase 1:** Subtareas completadas, archivos existen, ruff + mypy pasan.

### Fase 2: [Nombre de Fase]
**Objetivo:** [Que logra esta fase]

**Subtareas:**
- [ ] **Tarea 2.1:** [Integración y endpoints API]
  - Archivos: [rutas]
  - **Completado Cuando**: [Criterios medibles]
- [ ] **Tarea 2.2:** [Pruebas y validación]
  - Archivos: [rutas]
  - **Completado Cuando**: [Criterios medibles]

**Criterios de Finalización Fase 2:** Misma validación que Fase 1.

### Fase 3: Validación y Revisión (Obligatoria)

- [ ] Ejecutar `uv run ruff check .` y `uv run mypy .` — 0 NUEVOS errores introducidos por los cambios
- [ ] Presentar "Implementación Completa" → ofrecer revisión de código → esperar aprobación
- [ ] Si aprobado, ejecutar checklist de revisión:

**Checklist de Revisión Python (TODOS obligatorios):**

1. **Requisitos** — Mapear cada criterio de éxito a su implementación (archivo:función:línea). Si alguno NO CUMPLIDO → DETENER.
2. **Linting y tipos** — Ejecutar `uv run ruff check .` y `uv run mypy .`. 0 NUEVOS errores introducidos por los cambios (errores preexistentes fuera de alcance).
3. **Calidad Python:**
   - Type hints en TODAS las funciones nuevas/modificadas (parámetros + retorno, incluyendo `-> None`)
   - Sintaxis moderna: `list[str]` no `List[str]`, `X | None` no `Optional[X]`
   - 0 uso de tipo `Any` en código nuevo/modificado — usar tipos específicos
   - 0 cláusulas `except:` genéricas — capturar excepciones específicas
   - 0 `# type: ignore` sin justificación en código nuevo/modificado
   - Encadenamiento de excepciones: `raise X from e`
4. **Code smells** — Buscar EN ARCHIVOS MODIFICADOS: TODO/FIXME, print(), código comentado, imports no usados. Reportar hallazgos; NO eliminar sin confirmación del usuario.
5. **DRY** — En archivos modificados, verificar que no se duplica lógica ya existente en el codebase. Si se encuentra duplicación → reportar al usuario con propuesta de extracción; NO extraer automáticamente.
6. **KISS** — ¿Es la implementación más simple que satisface los criterios? Abstracciones prematuras y sobre-ingeniería son defectos, no mejoras.
7. **Separación de responsabilidades** — Rutas/views: solo orquestación. Lógica de negocio: en services. Acceso a datos: en repositories. Validación: Pydantic para datos externos.
8. **Integración** — Verificar imports de módulos modificados, referencia cruzada con pyproject.toml (cada import tiene su dependencia declarada), sin dependencias faltantes ni circulares.
9. **Regresión** — Ejecutar tests de módulos afectados por el cambio (`uv run pytest tests/módulo`). Suite completa solo si el cambio afecta dependencias compartidas. Si no hay tests para el código modificado → documentar como riesgo.
10. **Seguridad** (si aplica) — Validación de inputs, sin secretos hardcoded, permisos verificados, sin SQL raw sin parametrizar.

**Baseline de deuda técnica (ESTÁNDAR+):** Registrar al inicio: errores ruff, errores mypy, cobertura pytest. Repetir al final. El cambio no debe empeorar métricas significativamente: ruff/mypy (+0 nuevos), coverage (tolerancia -2%). Métricas preexistentes fuera de alcance.

**Veredicto:** APROBADO / CONDICIONAL / RECHAZADO. Si errores mypy nuevos > 0 o problemas críticos > 0 → REPORTAR al usuario con propuesta de corrección; NO corregir automáticamente sin aprobación.

- [ ] Presentar resumen al usuario para pruebas

---

<!-- SHARED-BLOCK: edge-cases-v1 -->
## 12. Análisis de Modos de Falla y Casos Extremos

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, omitir esta sección.**

> Analizar sistematicamente que puede salir mal ANTES de implementar. Los edge cases descubiertos aqui deben informar el diseño, no solo validarse en testing.

### Escenarios de Falla

| Componente/Flujo | Escenario de Falla | Impacto | Probabilidad | Mitigacion |
|-------------------|-------------------|---------|--------------|------------|
| [Servicio/Endpoint] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Integración] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Operación BD] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |

### Preguntas Obligatorias de Edge Cases

- [ ] **Inputs vacios/nulos**: Que pasa con None, strings vacios, listas vacias, dicts sin claves esperadas?
- [ ] **Escala**: Que pasa con 10x el volumen actual? Hay queries O(n^2) o loops que no escalan?
- [ ] **Concurrencia**: Que pasa con requests concurrentes al mismo recurso? Race conditions en async?
- [ ] **Dependencias externas**: Que pasa si la BD esta lenta, una API externa no responde, o un servicio falla?
- [ ] **Estado inconsistente**: Que pasa si una operacion multi-paso falla a la mitad? Hay transacciones/rollback?
- [ ] **Tipos en runtime**: Datos externos (JSON, CSV, API responses) tienen los tipos esperados? Se validan con Pydantic?
- [ ] **Encoding**: Hay caracteres Únicode, emojis, o encodings no-UTF8 que puedan romper el procesamiento?
- [ ] **Permisos/Auth**: El endpoint valida permisos correctamente? Un usuario no-autenticado puede acceder?
- [ ] **Archivos grandes**: Hay streaming para uploads/downloads? Memory footprint controlado?

### Fallas Criticas (Alto Impacto + Alta Probabilidad)
- [Listar las que requieren mitigacion obligatoria en el diseño]

### Riesgos Aceptados (Bajo Impacto o Baja Probabilidad)
- [Listar con justificacion de por que se acepta el riesgo]

<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: rollback-v1 -->
## 12B. Estrategia de Rollback (OBLIGATORIO para COMPLEJA/CRÍTICA)

Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:

```markdown
## Estrategia de Rollback

### Si el cambio de código rompe funcionalidad:
1. `git revert <commit_hash>`
2. Verificar que todos los tests pasen
3. Re-desplegar version anterior si es necesario

### Si la migración de base de datos falla:
1. Ejecutar migración reversa (si existe)
2. Restaurar desde backup si no hay migración reversa
3. Verificar integridad de datos con consultas de validación

### Si la migración de datos corrompe datos:
1. Restaurar desde backup: [procedimiento específico]
2. Verificar datos con: [consultas de validación]
3. Documentar causa raiz para prevencion futura
```

**Documentar:**
- **Disparadores de rollback:** [Que condiciones activan el rollback]
- **Tiempo estimado de rollback:** [Minutos/horas]
- **Datos en riesgo:** [Que datos podrian perderse]
- **Procedimiento de verificación post-rollback:** [Como confirmar que el rollback fue exitoso]
<!-- /SHARED-BLOCK -->

---

---

---

---

## 16. Análisis de Impacto (OMITIR para cambios aislados)

**USAR:** Cambios de arquitectura, cambios breaking, impactos multi-servicio, producción
**OMITIR:** Correcciones de bugs, cambios de configuración, actualizaciones de servicio único

### Evaluación de Impacto

#### 1. Cambios Breaking
- [ ] Contratos API existentes afectados?
- [ ] Dependencias de base de datos en estructuras modificadas?
- [ ] Otros servicios consumiendo interfaces cambiadas?

#### 2. Implicaciones de Rendimiento
- [ ] Impacto en consultas de base de datos?
- [ ] Aumento de uso de memoria?
- [ ] Cambios en tiempo de respuesta API?

#### 3. Seguridad
- [ ] Nueva superficie de ataque?
- [ ] Riesgos de exposicion de datos?

### BANDERAS ROJAS - Alertar al Usuario Inmediatamente
- [ ] Migracion de base de datos requerida en producción
- [ ] Cambios breaking en API
- [ ] Degradacion de rendimiento
- [ ] Vulnerabilidades de seguridad
- [ ] Riesgo de perdida de datos

---

<!-- SHARED-BLOCK: puerta-pre-impl-v1 -->
## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario (ESTÁNDAR+)
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Complejidad clasificada (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA)
- [ ] Pre-flight completado sin errores
- [ ] Archivos afectados identificados
- [ ] Alternativas evaluadas (ESTÁNDAR+)
- [ ] Casos extremos analizados (ESTÁNDAR+)
- [ ] Rollback documentado (COMPLEJA/CRÍTICA)
- [ ] Criterios de éxito medibles definidos
- [ ] Documento presentado y aprobado por usuario

Si CUALQUIER checkbox sin marcar: DETENER. No implementar.
<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: instrucciones-agente-v3 -->
## Instrucciones para el Agente de IA

**Rol: Ingeniero de Software Senior, no documentador.**

El asistente NO acepta la peticion del usuario sin analisis. ANTES de crear cualquier documento de tarea, ejecuta el Triaje de Ingenieria (T1-T2-T3).

**SIEMPRE:** Examinar el codebase antes de planificar. Trazar prerequisitos y dependencias. Cuestionar el enfoque cuando el analisis lo justifique. Proponer la solucion mas simple que resuelva el problema (KISS).

**NUNCA:** Documentar pasivamente lo que el usuario pide sin analizar. Fabricar objeciones sin razon tecnica. Sobre-disenar soluciones. Omitir prerequisitos bloqueantes.

### Disciplina de Alcance (OBLIGATORIO)

> Complementa la "Regla de Alcance Estricto" del Paso 0.6 con principios de decisión.

- **Decisiones intencionales:** Asumir que código existente fuera del alcance refleja decisiones de negocio válidas. No sugerir cambios a código funcional que no está en el scope.
- **Auto-remediación prohibida:** Nunca corregir problemas descubiertos durante review sin confirmación explícita del usuario. Reportar → esperar → actuar.

### Senales de Alerta (DETENER y comunicar al usuario)

- Peticion que cubre 2+ funcionalidades independientes - proponer desglose
- Prerequisitos bloqueantes que son tareas en si mismos - proponer crearlos primero
- El usuario pide la solucion X, pero el problema se resuelve mejor con Y - proponer Y
- Radio de impacto real difiere significativamente del intuido - re-clasificar complejidad
- Sobre-diseno detectado - proponer simplificacion

### Flujo de Trabajo

1. **Triaje** - Analizar impacto, prerequisitos, viabilidad (T1-T2-T3)
2. **Alinear** - Presentar alcance al usuario, obtener confirmacion
3. **Pre-flight** - Validar entorno Python (entorno, framework, deps)
4. **Documentar** - Crear documento de tarea con alcance validado
5. **Presentar** - Opciones A/B/C
6. **Implementar** - Solo tras aprobacion explicita, fase por fase

### Opciones de Implementacion (presentar siempre)

**A)** Vista Previa de Cambios de Codigo - fragmentos antes/despues
**B)** Proceder con Implementacion - fase por fase
**C)** Modificar o Iterar sobre el Plan - ajustar antes de comprometerse

Esperar eleccion explicita. NUNCA asumir aprobacion.

#### Regla de Alcance Estricto (ACTIVA durante toda la implementación)

> OBLIGATORIO: Solo modificar código directamente relacionado con la sección "Incluye".

- Si se descubre un problema FUERA del alcance:
  1. **NO arreglarlo** — documentarlo como nota en "Descubrimientos fuera de alcance" del task document
  2. Si es BLOQUEANTE para la tarea actual: PAUSAR, informar al usuario, esperar decisión
  3. Si NO es bloqueante: ignorarlo completamente
- **Test rápido:** ¿Este cambio está en "Incluye"? → SI: proceder. NO: no tocarlo.
- **Excepción única:** errores de sintaxis/compilación en líneas que YA se están modificando
- **Prohibido:** arreglar warnings, code smells, o deuda técnica encontrada "de paso"

### Durante Implementacion

Por cada fase completada:
- Actualizar checkbox del documento de tarea: `[x]` + timestamp + archivos modificados + resultado de verificacion (ruff/mypy)
- Si se descubre que el alcance era incorrecto - DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` - ejecutar checklist de revision - si APROBADO cambiar a `Completado`.

### Aprobacion Explicita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" - confirmar antes de proceder
<!-- /SHARED-BLOCK -->

---

### Directiva: Investigar Versiones Actuales

Antes de agregar dependencias de AI/ML (google-genai, vertexai, openai, langchain), investigar la ultima version estable publicada. No usar versiones hardcodeadas de esta plantilla sin verificar.

---

| Stack | Skill Recomendada |
|-------|-------------------|
| Python | `cleanup-python` + `reviewer` |
