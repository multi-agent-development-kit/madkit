# Plantilla de Tarea: Ecosistemas PHP (PHP/JS/HTML/SQL)

**Fecha de Creación:** YYYY-MM-DD
**Tipo:** [Feature / Enhancement / Fix / Integration / Migration]
**Plataforma:** [Auto-detectada en Paso 1]
**Stack:** PHP / JavaScript / HTML / CSS / SQL
**Complejidad Estimada:** [Simple / Estándar / Compleja / Crítica]

> **Cabecera de Metadatos opcional (T079):** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Ver documentación completa en [`task_template.md`](task_template.md) §"Cabecera de Metadatos del Task Doc (opcional)" — esta plantilla hereda esa especificación.

---

## CRÍTICO: Protocolo de Creación de Documentos de Tarea

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementar cambios directamente.**

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoría de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa secciones 0,3,6,9 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambio en un solo archivo PHP/JS/template
- Sin cambios de base de datos
- Sin nuevos hooks/eventos
- Limitado a 1-2 archivos
- Requisitos claros e inequívocos

**Ejemplos:**
- Corregir función PHP existente
- Modificar template/vista
- Agregar hook callback simple
- Actualizar estilos CSS

### TAREA ESTÁNDAR (Usa secciones 0-3,5,6,9 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Nuevas funciones/clases PHP
- Cambios de base de datos (schema, queries)
- Nuevos hooks/eventos
- 3-5 archivos afectados
- Integración de servicio externo

**Ejemplos:**
- Nuevo endpoint API con validación
- Agregar tabla custom con migración
- Implementar sistema de cache con transients
- Integrar pasarela de pago

### TAREA COMPLEJA (Usa todas las secciones - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Nuevo modulo/plugin completo
- Cambios en multiples tablas de base de datos
- Sistema de permisos personalizado
- 6+ archivos afectados
- Migración de datos entre versiones

**Ejemplos:**
- Plugin completo con admin, frontend y API
- Refactorizar sistema de checkout
- Implementar sistema de notificaciones

### TAREA CRÍTICA (Usa todas las secciones + plan de rollback obligatorio - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Cambios en tablas de producción con >100K registros
- Migraciones de datos en sitio activo
- Cambios en sistema de autenticacion
- Modificaciones al core de la plataforma
- Cambios que afectan pasarelas de pago

**Ejemplos:**
- Migrar schema con datos de producción
- Modificar flujo de autenticacion
- Actualizar versión de plataforma con breaking changes

---

<!-- SHARED-BLOCK: protocolo-creacion-v1 -->
### Paso 0.1: Verificar Estructura del Proyecto

Confirmar que la estructura de documentación requerida existe.

- Verificar que el directorio `ai_docs/` existe
- Verificar que el subdirectorio `ai_docs/tasks/` existe

**Si no se encuentra:** DETENER y preguntar al usuario: "No veo un directorio `ai_docs/`. ¿Debería crearlo?"

---

### Paso 0.2: Verificar Documento de Tarea Activa

**Antes de crear una nueva tarea, verificar si ya existe una para este trabajo:**

1. Listar archivos en `ai_docs/tasks/` y buscar un documento relacionado con la solicitud actual
2. Si el usuario pide correcciones/revisiones de trabajo anterior → encontrar y ACTUALIZAR ese documento
3. Si el usuario pide continuar implementación → encontrar y ACTUALIZAR ese documento
4. **Solo crear un nuevo número de tarea si es trabajo genuinamente NUEVO sin documento existente**

**Si se encuentra tarea activa:** Saltar al Paso 0.5 y trabajar sobre el documento existente.

---

### Paso 0.3: Detectar Siguiente Número de Tarea

**Solo si el Paso 0.2 confirmó que no aplica ninguna tarea existente:**

1. Listar archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de CADA nombre de archivo
3. Encontrar el número más alto entre TODOS los archivos
4. Sumar 1 y formatear con 3 dígitos
5. Si no existen archivos: usar 001

**Reglas:** Secuencia global compartida, siempre 3 dígitos, cada número se usa EXACTAMENTE UNA VEZ.
- ❌ El número `000` está RESERVADO para calibración del proyecto — nunca usar para tareas normales

---

### Paso 0.4: Crear Documento de Tarea

**CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo. Sin excepciones.**

**Convención de Nombres para PHP/Web:**
- **Formato:** `XXX_camelCaseName.md`
- **Convención:** camelCase (PHP/Web)
- **Ubicación:** `ai_docs/tasks/XXX_camelCaseName.md`
- **Verificar:** NO exista un archivo con ese prefijo de número

---

### Paso 0.5: Presentar Documento de Tarea al Usuario

**NOTA:** El análisis crítico de impacto, prerequisitos y alcance ya se realizó en el Triaje de Ingeniería (Paso 0.0.6). Aquí se presenta el documento ya validado.

**Verificación rápida antes de presentar:**
- ¿El documento refleja el alcance validado en T3? Si no → actualizar.
- ¿El análisis de dependencias reveló algo nuevo? Si sí → comunicar como observación.

**Después de completar el triaje, presentar estas 3 opciones:**

```
Documento de Tarea Creado: `ai_docs/tasks/XXX_camelCaseName.md`

**Resumen del Enfoque Planificado:**
[Breve resumen de 2-3 oraciones]

[Solo si se descubrió algo nuevo:]
**Observaciones y Sugerencias del Asistente:**
Tras analizar la tarea y el codebase, he identificado lo siguiente:

1. **[Categoría]:** [Observación o sugerencia concreta]
2. **[Categoría]:** [Observación o sugerencia concreta]
3. **[Categoría]:** [Observación o sugerencia concreta — si aplica]

> Categorías válidas: Dependencia detectada | Prerequisito | Alternativa de enfoque | Optimización | Riesgo identificado | Ajuste de alcance | Refactorización recomendada

**¿Cómo deseas proceder?**

**A) Vista Previa de Cambios de Código Detallados**
**B) Aprobar e Iniciar Implementación**
**C) Modificar o Iterar sobre el Plan**
Ajustar el enfoque, explorar las sugerencias, o refinar el plan antes de comprometerse.
```

**PUNTO DE ESPERA OBLIGATORIO:** DETENERSE y esperar elección explícita del usuario.

**NOTA SOBRE ITERACIÓN:** La iteración es el proceso normal. Las tareas raramente están perfectas en la primera versión. Si el usuario elige C, actualizar el documento existente, incorporar el feedback, y re-presentar con nuevas sugerencias basadas en la conversación.

---

### Paso 0.6: Manejar Retroalimentación del Usuario

**Si el usuario elige Opción C (Modificar) o solicita cambios:**
- Actualizar el documento de tarea EXISTENTE — NO crear nuevos archivos
- NO crear nuevas versiones (`_v2`, `_updated`, etc.)

---

### Paso 0.7: Actualizaciones de Fase de Implementación

**Cuando el usuario aprueba (Opción B) y la implementación comienza:**
- Documentar progreso en el documento de tarea EXISTENTE agregando/actualizando una sección `## Progreso`
- NO modificar plantillas en `.claude/commands/`

#### Regla de Alcance Estricto (ACTIVA durante toda la implementación)

> OBLIGATORIO: Solo modificar código directamente relacionado con la sección "Incluye".

- Si se descubre un problema FUERA del alcance:
  1. **NO arreglarlo** — documentarlo como nota en "Descubrimientos fuera de alcance" del task document
  2. Si es BLOQUEANTE para la tarea actual: PAUSAR, informar al usuario, esperar decisión
  3. Si NO es bloqueante: ignorarlo completamente
- **Test rápido:** ¿Este cambio está en "Incluye"? → SI: proceder. NO: no tocarlo.
- **Excepción única:** errores de sintaxis/compilación en líneas que YA se están modificando
- **Prohibido:** arreglar warnings, code smells, o deuda técnica encontrada "de paso"

**Convención de Nomenclatura:** `XXX_camelCaseName.md` (camelCase para proyectos web)

**Agregar sección de seguimiento:**
```markdown
## Seguimiento del Ciclo de Vida de Tarea

### Creación
- **Creado:** [timestamp]
- **Creado Por:** task_template_php.md
- **Número de Tarea:** [XXX]
- **Complejidad Inicial:** [Simple | Estándar | Compleja | Crítica]

### Revisiones
- [Fecha]: [Que cambio y por que]

### Progreso de Implementación / Estado de Finalización
- **Estado:** [Planificación | En Progreso | Pending Review | Completado | Bloqueado]
- **Ultima Actualización:** [timestamp]
```
<!-- /SHARED-BLOCK -->

---

## 0. Validación Pre-Vuelo (OBLIGATORIA)

Validar todos los prerequisitos antes de proceder. NO continuar si CUALQUIER validación falla.

**Paso 0.0.1: Prerequisitos de Detección de Plataforma**
- Buscar archivos de firma de configuración:
  - WordPress: `wp-config.php`, `wp-content/`, `wp-includes/`
  - Magento: `app/etc/env.php`, `app/code/`, `pub/`
  - PrestaShop: `config/settings.inc.php`, `classes/`, `controllers/`
  - Laravel: `artisan`, `composer.json` con laravel/framework
  - Drupal: `sites/default/settings.php`
  - PHP Personalizado: `config.php`, `index.php`
- Extraer versión de plataforma de archivos de configuración
- Detectar plugins/extensiones clave (WooCommerce, ACF, etc.)

**Paso 0.0.2: Entorno PHP**
- PHP 8.2+ instalado y accesible (`php -v`)
- Extensiones requeridas presentes: mysqli/pdo_mysql, curl, json, mbstring, gd, xml
- Verificar compatibilidad PHP específica de la plataforma:

| Plataforma | PHP Min | Recomendado | Extensiones Criticas |
|------------|---------|-------------|---------------------|
| WordPress 6.8+ | 8.2 | 8.3-8.4 | mysqli, curl, mbstring, gd, xml, zip |
| Magento 2.4.8+ | 8.2 | 8.3-8.4 | bcmath, intl, mbstring, soap, xsl, zip, sockets |
| PrestaShop 9.0+ | 8.1 | 8.2-8.3 | curl, intl, mbstring, pdo_mysql, zip |
| Laravel 12 | 8.2 | 8.3-8.4 | ctype, curl, mbstring, openssl, pdo, tokenizer |
| Drupal 11 | 8.3 | 8.3-8.4 | gd/imagick, pdo_mysql, xml, mbstring |

**PHP 8.4 Features (nov 2024) — verificar disponibilidad:**
- Property Hooks (`get`/`set` en propiedades de clase)
- Asymmetric Visibility (`private(set)` para readable público, writable privado)
- Nuevas funciones array: `array_find()`, `array_find_key()`, `array_any()`, `array_all()`
- Class instantiation sin paréntesis: `new MyClass()->method()`

**Paso 0.0.3: Convencion de Nomenclatura**
- Confirmar que el proyecto web usa nomenclatura camelCase para archivos de tarea
- Si no es una aplicacion web, redirigir a plantilla apropiada (task_template.md, task_template_python.md, task_template_adk.md)

**Checklist Pre-Vuelo (TODOS deben pasar):**
- [ ] Archivos de firma de plataforma encontrados
- [ ] Entorno PHP compatible
- [ ] Plataforma confirmada o selección manual lista
- [ ] Convencion de nomenclatura confirmada (camelCase)

Si TODOS pasan: proceder al Paso 0 (Detección Automática de Plataforma).

---

### 0.0.6 — Triaje de Ingeniería (OBLIGATORIO para ESTÁNDAR+)

<!-- AI Agent: Para tareas SIMPLE (<=2 archivos), el triaje es mental. Para ESTÁNDAR+, es conversación explícita con el usuario. -->

**T1: Analizar** — Examinar el codebase para responder:

- **Radio de impacto:** ¿Cuántos archivos PHP, templates, hooks, filtros, tablas se ven afectados?
  - <=2 archivos en 1 módulo/plugin → SIMPLE
  - 3-6 archivos en 1-2 módulos → ESTÁNDAR
  - 6+ archivos o 3+ módulos/plugins → COMPLEJA
  - Tablas >100K registros, datos producción, modificaciones al core → CRÍTICA
- **Prerequisitos:** ¿Plataforma correcta? ¿Plugins/módulos necesarios activos? ¿Versión PHP compatible? Trazar dependencias (max 2 niveles). ✅ existe | ❌ falta.
- **Integración:** ¿Hay hooks/filtros nativos que resuelven esto? ¿Patrones de la plataforma establecidos?
- **Stack-specific:** ¿Hook nativo o solución custom? ¿Plugin o functions.php? ¿Override o extensión? Verificar antes de planificar.

**T2: Cuestionar (solo si hay razón):**

- Alcance cubre 2+ funcionalidades independientes → proponer desglose
- Existe hook/filtro nativo de la plataforma → proponerlo en lugar de código custom
- Prerequisitos bloqueantes (plugins, versión PHP, permisos) → proponer resolverlos primero
- Sobre-diseño detectado → proponer simplificación (KISS)

**T3: Alinear** — Para ESTÁNDAR+, presentar al usuario:

```
Alcance: [1-2 frases]
Complejidad: [nivel] — [N archivos, M módulos]
Prerequisitos: [lista si hay] / Ninguno detectado
¿Confirmas este alcance para crear el documento de tarea?
```

**PUNTO DE ESPERA:** Para ESTÁNDAR+, esperar confirmación antes de proceder.

---

## Contexto del Proyecto y Enfoque de Desarrollo

### OBLIGATORIO: Detectar Etapa del Proyecto

**Esta plantilla esta optimizada para sistemas BROWNFIELD/LEGACY, pero verificar primero.**

**GREENFIELD** (Desarrollo nuevo):
- Codebase inicializado recientemente (< 6 meses), sin usuarios de producción
- Datos existentes minimos, fase de desarrollo activo
- Aceptable: cambios breaking, cambios de schema sin migraciones, refactorizacion agresiva
- Nota: Si es greenfield, considerar usar `task_template.md` en su lugar

**BROWNFIELD** (Sistema establecido - COMUN PARA ESTA PLANTILLA):
- Sistema de producción existente con usuarios activos y datos de producción
- Código legacy, dependencias no documentadas, personalizaciones historicas
- Requerido: análisis exhaustivo de dependencias, backups completos, pruebas de regresion, planes de rollback

**HIBRIDO** (Mixto):
- Para código existente/producción: enfoque brownfield
- Para nuevas funcionalidades aisladas: enfoque greenfield
- En puntos de integración: enfoque brownfield (proteger existente)

**Detección**: Verificar config de despliegue, funcionalidades orientadas al usuario, datos de base de datos, edad del historial git. Preguntar al usuario si hay duda.

**Documentar en cada tarea:**
```markdown
## Contexto del Proyecto

**Etapa del Proyecto**: [Greenfield / Brownfield / Hibrido]
**Evidencia**: [Que indica esta etapa]
**Enfoque de Desarrollo**: [Iteracion rapida / Preservacion cuidadosa / Mixto]
**Caracteristicas Legacy** (si Brownfield):
- Usuarios de producción: [Si/No]
- Datos de producción: [Si/No]
- Dependencias no documentadas: [Sospechadas/Conocidas/Ninguna]
- Modificaciones al core: [Si/No - CRÍTICO si Si]
**Restricciones**:
- Compatibilidad hacia atras: [Requerida / No requerida]
- Preservacion de datos: [Critica / Puede regenerarse]
- Cambios breaking: [Aceptables / Prohibidos]
```

**REGLA CRÍTICA**: Por defecto enfoque brownfield. Los sistemas web legacy tienen alto riesgo de dependencias no documentadas.

---

## 0. Detección Automática de Plataforma (OBLIGATORIA)

### Protocolo de Detección de Plataforma en 5 Pasos

**OBJETIVO:** Identificar exactamente cual plataforma/CMS/framework esta en uso.

**Paso0.1: Detección de Archivos de Configuración**

**Información Requerida:**
- Verificar archivos de firma de plataforma:
  - WordPress: `wp-config.php`, `wp-includes/version.php`
  - Magento 2: `app/etc/env.php` / Magento 1: `app/Mage.php`
  - PrestaShop: `config/config.inc.php` (buscar `_PS_VERSION_`)
  - Drupal: `sites/default/settings.php`
  - Joomla: `configuration.php`
  - Laravel: archivo `artisan`, `composer.json` con laravel/framework
  - Symfony: `bin/console`
  - Fallback: `index.php` (PHP generico)

**DOCUMENTAR:**
- **Plataforma Detectada:** [WordPress / Magento 2 / PrestaShop / Drupal / Joomla / Laravel / Custom]
- **Versión:** [extraida de archivos de configuración]
- **Confianza:** Alta (multiples archivos) / Media (archivo único)

**Paso0.2: Detección de Estructura de Directorios**

**Información Requerida:**
- Listar directorios raiz
- Verificaciones específicas por plataforma:
  - WordPress: `wp-content/themes`, `wp-content/plugins`, `wp-content/uploads`
  - Magento 2: `app/code`, `vendor/magento`, `pub/static`
  - PrestaShop: `modules`, `themes`, `override`
  - Custom/Otro: Todos los directorios 2 niveles de profundidad

**DOCUMENTAR:**
- **Estructura detectada:** [arbol de directorios principal]
- **Directorios de personalizacion:** [themes/, modules/, plugins/, custom/, override/]
- **Directorios de assets:** [css/, js/, images/, media/]

**Paso0.3: Detección de Base de Datos**

**Información Requerida:**
- Versión del motor DB (MySQL, MariaDB, PostgreSQL)
- Extraer configuración de archivos específicos de plataforma (nombre DB, host, prefijo, charset)
- Seguridad: NO mostrar contrasenas

**DOCUMENTAR:**
- **Motor DB:** [MySQL X.X / MariaDB X.X / PostgreSQL X.X]
- **Nombre DB:** [database_name]
- **Prefijo de tabla:** [wp_ / ps_ / m2_ / custom_]
- **Charset:** [utf8mb4 / utf8 / latin1]

**Paso0.4: Detección de Servidor Web**

**Información Requerida:**
- Detectar servidor web en ejecucion (Apache o Nginx) y versión
- Verificar configuración de reescritura de URL: `.htaccess` (Apache) o archivos conf de nginx

**Paso0.5: Generar Perfil de Plataforma**

```markdown
## PERFIL DE PLATAFORMA DETECTADO

**Sistema:**
- Plataforma: [WordPress 6.8 / Magento 2.4.8 / PrestaShop 9.0 / etc.]
- Versión: [X.X.X]
- Tipo de instalacion: [Estándar / Personalizado / Multi-sitio]

**Stack Técnico:**
- PHP: [X.X.X]
- Base de Datos: [MySQL X.X / MariaDB X.X]
- Servidor Web: [Apache X.X / Nginx X.X]
- Gestores de Dependencias: [Composer, NPM]

**Estructura:**
- Raiz del proyecto: [/path/to/root]
- Directorio de personalizacion: [wp-content/ / app/code/ / modules/]
- Directorio de temas: [themes/]
- Directorio de assets: [pub/static/ / assets/ / media/]

**Base de Datos:**
- Motor: [MySQL X.X]
- Nombre: [database_name]
- Prefijo: [prefix_]
- Charset: [utf8mb4]
- Total tablas: [cantidad]

**Personalizaciones Detectadas:**
- Plugins/modulos personalizados: [cantidad y lista]
- Temas personalizados: [cantidad y lista]
- Overrides: [cantidad y lista]
- Modificaciones al core: [SI/NO - CRÍTICO si SI]

**Estado del Sistema:**
- Modo desarrollo: [Habilitado/Deshabilitado]
- Cache: [Tipo y estado]
- Modo producción: [SI/NO]
```

**CHECKLIST DE DETECCION (TODOS deben pasar):**
- [ ] Plataforma identificada
- [ ] Versión determinada
- [ ] Base de datos identificada (motor, nombre, prefijo)
- [ ] Servidor web detectado
- [ ] Estructura de directorios mapeada

**REGLA:** Si CUALQUIER item de detección falla, DETENER. No proceder sin perfil de plataforma completo.

---

## 1. Análisis Exhaustivo de Dependencias y Riesgos

### Protocolo de Análisis de Dependencias en 4 Pasos

**OBJETIVO:** Identificar TODAS las dependencias, hooks, filtros, eventos y puntos de integración antes de hacer CUALQUIER cambio.

**Paso1.1: Hooks, Filtros y Eventos (Especificos de Plataforma)**

**Para WordPress:**
```bash
grep -rn "add_action\|add_filter" . --include="*.php" | grep "key_term"
grep -rn "do_action\|apply_filters" . --include="*.php" | grep "key_term"
```

**Para Magento:**
```bash
find . -name "events.xml" -exec grep -H "key_term" {} \;
find . -name "di.xml" -exec grep -H -A 5 "plugin\|preference" {} \; | grep "key_term"
```

**Para PrestaShop:**
```bash
grep -rn "registerHook\|Hook::exec" . --include="*.php" | grep -i "key_term"
```

**DOCUMENTAR Tabla de Hooks/Eventos:**

| Hook/Evento | Tipo | Archivo | Prioridad | Callback | Impacto |
|-------------|------|---------|-----------|----------|---------|
| woocommerce_checkout_process | action | checkout.php:45 | 10 | custom_validation() | ALTO |

**Paso1.2: Personalizaciones y Overrides**

**Información Requerida:**
- WordPress: diferencias de child theme, plugins personalizados
- Magento: overrides di.xml, preferences, plugins (interceptors)
- PrestaShop: clases override
- Modificaciones al core (CRÍTICO si se encuentran)
- Parches aplicados

**DOCUMENTAR:**
```markdown
**Modificaciones al Core:** [SI/NO]
- Si SI: RIESGO CRÍTICO - Listar archivos modificados con rangos de linea

**Child Theme/Modulos Personalizados:** [cantidad y lista]
**Clases Override:** [lista con descripción de impacto]
**Parches Aplicados:** [lista con fechas]
```

**Paso1.3: Generar Mapa Completo de Dependencias**

```markdown
## MAPA COMPLETO DE DEPENDENCIAS

**Alcance del Impacto:**
- Archivos PHP afectados: [cantidad]
- Archivos JS afectados: [cantidad]
- Templates afectados: [cantidad]
- Tablas DB involucradas: [cantidad]
- Hooks/eventos disparados: [cantidad]

**Arbol de Dependencias:**
[Función a Modificar]
+-- Llamada desde: file1.php:45 (12 veces)
|   +-- Usada en: template1.php
|   +-- Disparada por: hook 'action_name'
+-- Llama a: helper_function() en helpers.php:23
|   +-- Modifica tabla: products
|   +-- Dispara evento: 'product.updated'
+-- Hooks registrados:
    +-- before_function (3 callbacks)
    +-- after_function (5 callbacks)

**Puntos de Riesgo Identificados:**
1. CRÍTICO: Modificacion en tabla con 150K+ registros
2. ALTO: 12 plugins dependen del hook 'action_name'
3. MEDIO: Template usado en 5 paginas diferentes
4. BAJO: Función helper solo usada internamente
```

**CHECKLIST DE ANALISIS DE DEPENDENCIAS (TODOS deben pasar):**
- [ ] Hooks/Eventos y sus callbacks documentados
- [ ] Personalizaciones y modificaciones al core detectadas
- [ ] Mapa completo de dependencias con puntos de riesgo generado

**REGLA:** Si CUALQUIER item esta incompleto, DETENER. No proceder sin análisis completo.

---

<!-- SHARED-BLOCK: alternativas-v1 -->
## 2. Análisis Estratégico y Alternativas de Solución

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, documentar brevemente por que solo hay un enfoque viable.**

> Despues de completar el análisis de dependencias, explorar MULTIPLES enfoques ANTES de comprometerse con uno.

### Criterio de Activación

Realizar análisis completo si se cumplen 2+ criterios:
- [ ] Multiples enfoques: 3+ soluciones técnicas distintas existen
- [ ] Variacion significativa de tiempo: >50% diferencia entre enfoques
- [ ] Compromisos medibles: >20% diferencia en rendimiento, costo o mantenibilidad
- [ ] Restricciones permanentes: La decisión crea lock-in a largo plazo
- [ ] Amplio impacto en sistema: Cambios afectan 5+ sistemas interconectados

### Contexto del Problema
[Explicar el problema y por que se deben considerar multiples soluciones]

### Análisis de Alternativas de Solución

#### Alternativa 1: [Nombre de Solución]
**Enfoque:** [Descripción breve]
**Pros:** [Listar beneficios específicos]
**Contras:** [Listar limitaciones específicas]
**Complejidad de Implementación:** [Baja/Media/Alta] - [Justificación]
**Nivel de Riesgo:** [Bajo/Medio/Alto] - [Factores de riesgo principales]

#### Alternativa 2: [Nombre de Solución]
**Enfoque:** [Descripción breve]
**Pros:** [Lista]
**Contras:** [Lista]
**Complejidad de Implementación:** [Baja/Media/Alta] - [Justificación]
**Nivel de Riesgo:** [Bajo/Medio/Alto] - [Factores de riesgo principales]

#### Alternativa 3: [Nombre de Solución] (si aplica)
**Enfoque:** [Descripción breve]
**Pros / Contras / Complejidad / Riesgo:** [Como arriba]

### Recomendación y Justificación

**SOLUCIÓN RECOMENDADA:** Alternativa [X] - [Nombre de Solución]

**Por que es la mejor alternativa:**
1. [Razón principal con justificación]
2. [Razón secundaria con evidencia]
3. [Consideraciones a largo plazo]

### Matriz de Compromisos

| Factor | Alternativa 1 | Alternativa 2 | Alternativa 3 | Ganador |
|--------|---------------|---------------|---------------|---------|
| **Complejidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Rendimiento** | B/M/A | B/M/A | B/M/A | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Compatibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Deuda Técnica** | B/M/A | B/M/A | B/M/A | [ ] |

**Alternativas Rechazadas:**
- Alternativa [Y]: Rechazada porque [razón concreta]

**DECISIÓN DEL USUARIO REQUERIDA:**
Presentar las alternativas al usuario con la recomendacion. Esperar aprobación antes de proceder.
<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: edge-cases-v1 -->
## 2B. Análisis de Modos de Falla y Casos Extremos

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, omitir esta sección.**

> Antes de disenar la implementación, analizar sistematicamente que puede salir mal. En ecosistemas PHP (WordPress, Magento, Laravel), los fallos mas comunes vienen de conflictos entre plugins/modulos, incompatibilidades de versión PHP y datos de usuario impredecibles.

### Escenarios de Falla

| Componente/Flujo | Escenario de Falla | Impacto | Probabilidad | Mitigacion |
|-------------------|-------------------|---------|--------------|------------|
| [Hook/Plugin] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Query BD] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [API/Integración] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |

### Fallas Criticas (Alto Impacto + Alta Probabilidad)
- [Listar las que requieren mitigacion obligatoria]

### Riesgos Aceptados (Bajo Impacto o Baja Probabilidad)
- [Listar con justificación]
<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: rollback-v1 -->
## 2C. Estrategia de Rollback (OBLIGATORIO para COMPLEJA/CRÍTICA)

Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:

### Si el cambio de código rompe funcionalidad:
1. Restaurar archivos desde backup: `tar -xzf backup_files_TIMESTAMP.tar.gz`
2. Verificar que la funcionalidad anterior funciona correctamente
3. Limpiar cache de plataforma

### Si la migración de base de datos falla:
1. Restaurar desde backup: `mysql -u user -p db_name < backup_db_TIMESTAMP.sql`
2. Verificar integridad de datos
3. Verificar funcionalidad en navegador

### Si la integración con plataforma se rompe:
1. Revertir cambios en archivos modificados
2. Restaurar configuración de plataforma desde backup
3. Verificar que plugins/módulos de terceros operan normalmente

**Documentar:**
- **Disparadores de rollback:** [Qué condiciones activan el rollback]
- **Tiempo estimado de rollback:** [Minutos/horas]
- **Datos en riesgo:** [Qué datos podrían perderse]
- **Verificación post-rollback:** [Cómo confirmar éxito]
<!-- /SHARED-BLOCK -->

---

## 3. Requisitos y Definicion de Estrategia

### Descripción del Cambio Requerido
[Descripción clara y concisa de lo que necesita implementarse/modificarse/corregirse]

### Contexto de Negocio
[Por que es necesario este cambio? Que problema resuelve?]

### Criterios de Éxito (Medibles y Verificables)

**REGLA:** Cada criterio debe incluir metodo de verificación Y confirmacion de que nada existente se rompe.

**Criterios Funcionales:**
- [ ] **Criterio 1:** [Nueva funcionalidad]
  - **Verificación:** [Pasos de prueba específicos]
  - **Regresion:** [Verificación de funcionalidad existente]
  - **Ubicacion:** [Archivos donde se implementa]

- [ ] **Criterio 2:** [Modificacion completada]
  - **Verificación / Regresion / Ubicacion:** [Como arriba]

**Criterios de No-Regresion (OBLIGATORIOS):**
- [ ] **Funcionalidad existente 1 sigue funcionando:** [nombre de funcionalidad]
  - **Prueba:** [Pasos exactos] / **Archivos criticos:** [Lista]

**Criterios Tecnicos (OBLIGATORIOS):**
- [ ] Cero errores PHP: `php -l file.php` pasa
- [ ] Cero errores JS: Consola del navegador limpia
- [ ] Base de datos intacta: Todas las consultas funcionan, sin perdida de datos
- [ ] Rendimiento no degradado: Tiempo de carga dentro de +10%
- [ ] Backup completado y verificado antes de cambios

---

## 4. Estrategia de Implementación Segura

### Protocolo de Seguridad de 5 Capas

**CAPA 1: Entorno de Desarrollo/Staging (OBLIGATORIO)**

Verificar entorno antes de hacer cambios. Revisar flags de modo dev:
- WordPress: `grep "WP_DEBUG" wp-config.php`
- Magento: `cat app/etc/env.php | grep "MAGE_MODE"`
- PrestaShop: `grep "_PS_MODE_DEV_" config/defines.inc.php`

Si NO esta en dev/staging: DETENER INMEDIATAMENTE.

---

## 5. Plan de Implementación Detallado

### Fase 4: Pruebas Exhaustivas

**PROTOCOLO DE PRUEBAS DE 4 NIVELES:**

**NIVEL 1: Pruebas Funcionales de Nuevas Funcionalidades (30 min)**
- [ ] Nuevas funcionalidades funcionan correctamente con casos borde (campos vacios, chars especiales, valores extremos)

**NIVEL 2: Pruebas de Regresion (60 min)**
- [ ] Todas las funcionalidades criticas que dependen de código modificado siguen funcionando
- [ ] Plugins/modulos de terceros operan normalmente

**NIVEL 3: Pruebas Tecnicas (30 min)**
- [ ] Sin errores PHP: `php -l` en todos los archivos modificados, sin nuevas entradas en log de errores
- [ ] Sin errores JavaScript: Consola DevTools limpia en paginas afectadas
- [ ] Consultas de base de datos optimizadas: sin consultas lentas
- [ ] Rendimiento no degradado: tiempo de carga dentro de +10%, tamaño de pagina dentro de +10%

**NIVEL 4: Pruebas de Integración (30 min)**
- [ ] Pasarelas de pago, APIs externas, envio de email funcionan
- [ ] Multi-navegador: Chrome, Firefox, Safari, Edge, Responsive movil

**REGLA:** Si CUALQUIER prueba FALLA, DETENER. Investigar y corregir antes de proceder.

---

## 6. Revisión de Código y Validación Final

### Checklist de Revisión de Código para Ecosistemas Legacy

**REPORTE FINAL DE REVISION DE CODIGO:**
```markdown
## REPORTE DE REVISION DE CODIGO

**General:** APROBADO / CONDICIONAL / RECHAZADO
**Puntuacion Total:** X/50
- PHP: X/15 | JS: X/10 | DB: X/10 | Frontend: X/5 | Arquitectura: X/10

**Problemas Criticos:** [cantidad] -- [lista]
**Problemas Menores:** [cantidad] -- [lista]

**Bloqueadores:** [lista si RECHAZADO/CONDICIONAL]
**Correcciones Requeridas:** [lista]
```

**REGLAS:** Vulnerabilidades de seguridad > 0 = RECHAZADO. Errores PHP/JS > 0 = RECHAZADO. Funcionalidad existente rota = RECHAZADO.

---

## 7. Despliegue a Producción

### Protocolo de Despliegue Seguro de 10 Pasos

**PREREQUISITOS:**
- [ ] Revisión de código APROBADA
- [ ] Pruebas 100% APROBADAS
- [ ] Backups verificados (< 1 hora de antiguedad)
- [ ] Plan de rollback documentado
- [ ] Ventana de bajo trafico programada
- [ ] Stakeholders notificados

**Paso 7.1: Backup Final Pre-Despliegue**
```bash
mysqldump -u user -p prod_db_name > backup_prod_pre_deploy_$(date +%Y%m%d_%H%M%S).sql
tar -czf backup_prod_files_$(date +%Y%m%d_%H%M%S).tar.gz /production/path/file1.php /production/path/file2.js
```

**Paso 7.2: Habilitar Modo Mantenimiento** (específico de plataforma)

**Paso 7.3: Sincronizar Archivos a Producción**
- Git: `git pull origin feature-branch-name`
- rsync: `rsync -avz --dry-run file1.php user@prod-server:/production/path/` (verificar, luego ejecutar sin --dry-run)
- Upload manual FTP/SFTP

**Paso 7.4: Ejecutar Migraciones de Base de Datos** (si aplica)
```bash
mysql -u user -p -e "SELECT 1;"  # Verificar conexion
mysql -u user -p prod_db_name < db_changes.sql
mysql -u user -p -e "DESCRIBE prod_db_name.modified_table;"  # Verificar
```

**Paso 7.5: Limpiar Caches**
- WordPress: `wp cache flush` o `rm -rf wp-content/cache/*`
- Magento 2: `php bin/magento cache:clean && php bin/magento cache:flush && php bin/magento indexer:reindex`
- PrestaShop: `rm -rf cache/smarty/compile/* cache/smarty/cache/*`
- Varnish/CDN: Purgar segun necesidad

Si CUALQUIER cosa sale mal durante el despliegue: ejecutar PLAN DE ROLLBACK inmediatamente.

---

## Checklist Final de Completitud de Tarea

**Análisis y Planificacion:**
- [ ] Plataforma detectada y perfil generado
- [ ] Análisis exhaustivo de dependencias (4 pasos) completado
- [ ] Mapa de dependencias con puntos de riesgo generado
- [ ] Estrategia de implementación segura definida
- [ ] Plan de rollback documentado

**Implementación:**
- [ ] Backups realizados y verificados
- [ ] Cambios implementados incrementalmente con commits atomicos
- [ ] Código cumple estándares de calidad

**Pruebas:**
- [ ] Funcional: 100% APROBADO
- [ ] Regresion: 100% APROBADO
- [ ] Técnico: Sin errores PHP/JS
- [ ] Rendimiento: < 10% degradacion
- [ ] Multi-navegador: APROBADO

**Revisión de Código:**
- [ ] Revisión completada: APROBADA
- [ ] Vulnerabilidades de seguridad: 0
- [ ] Problemas criticos: 0

**Despliegue:**
- [ ] Despliegue a producción exitoso
- [ ] Smoke tests APROBADOS
- [ ] Modo mantenimiento deshabilitado
- [ ] Sin errores en log de producción

**Monitoreo:**
- [ ] 24h estable
- [ ] Rendimiento normal
- [ ] Retroalimentacion de usuarios positiva/neutral

**Documentación:**
- [ ] Registro de cambios completado
- [ ] Procedimiento de rollback actualizado
- [ ] README/Wiki actualizado
- [ ] Equipo notificado

**REGLA:** Si CUALQUIER item esta incompleto, la tarea NO esta completa.

---

---

<!-- SHARED-BLOCK: puerta-pre-impl-v1 -->
## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario (ESTÁNDAR+)
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Complejidad clasificada (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA)
- [ ] Pre-flight completado sin errores
- [ ] Plataforma detectada y perfil generado
- [ ] Análisis de dependencias completado (4 pasos)
- [ ] Archivos afectados identificados
- [ ] Alternativas evaluadas (ESTÁNDAR+)
- [ ] Casos extremos analizados (ESTÁNDAR+)
- [ ] Rollback documentado (COMPLEJA/CRÍTICA)
- [ ] Criterios de éxito medibles definidos
- [ ] Documento presentado y aprobado por usuario

→ Si CUALQUIER checkbox sin marcar: DETENER. No implementar.
<!-- /SHARED-BLOCK -->

---

<!-- SHARED-BLOCK: instrucciones-agente-v3 -->
## Instrucciones para el Agente de IA

**Rol: Ingeniero de Software Senior, no documentador.**

El asistente NO acepta la petición del usuario sin análisis. ANTES de crear cualquier documento de tarea, ejecutar el Triaje de Ingeniería (Paso 0.0.6): analizar impacto, trazar prerequisitos, evaluar alcance.

### Disciplina de Alcance (OBLIGATORIO)

> Complementa la "Regla de Alcance Estricto" del Paso 0.6 con principios de decisión.

- **Decisiones intencionales:** Asumir que código existente fuera del alcance refleja decisiones de negocio válidas. No sugerir cambios a código funcional que no está en el scope.
- **Auto-remediación prohibida:** Nunca corregir problemas descubiertos durante review sin confirmación explícita del usuario. Reportar → esperar → actuar.

### Señales de Alerta (DETENER y comunicar al usuario)

- Petición que cubre 2+ funcionalidades independientes → proponer desglose en tareas separadas
- Prerequisitos bloqueantes que son tareas en sí mismos → proponer crearlos primero
- Existe solución más simple en el codebase o framework → proponerla
- Radio de impacto sugiere complejidad diferente a la intuida → advertir y re-clasificar
- Se pide crear complejidad innecesaria → proponer simplificación (KISS)

### Flujo de Trabajo

1. **Triaje** — Analizar impacto, prerequisitos, alcance (Paso 0.0.6 — T1/T2/T3)
2. **Alinear** — Presentar alcance al usuario, esperar confirmación (ESTÁNDAR+)
3. **Pre-flight** — Verificar entorno PHP (plataforma, versión, estructura)
4. **Documentar** — Crear documento de tarea con alcance validado
5. **Presentar** — Opciones A/B/C
6. **Implementar** — Solo tras aprobación explícita (opción B)

### Opciones de Implementación (presentar siempre)

**A)** Vista Previa de Cambios de Código — fragmentos antes/después
**B)** Proceder con Implementación — fase por fase
**C)** Modificar o Iterar sobre el Plan — ajustar antes de comprometerse

Esperar elección explícita. NUNCA asumir aprobación.

### Durante Implementación

Por cada fase completada:
- Actualizar checkbox: `[x]` + timestamp + archivos modificados + resultado de verificación (lint/errores PHP/JS)
- Si se descubre que el alcance era incorrecto → DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` → ejecutar checklist de revisión → si APROBADO cambiar a `Completado`.

### Aprobación Explícita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" → confirmar antes de proceder
<!-- /SHARED-BLOCK -->

---

| Stack | Skill Recomendada |
|-------|-------------------|
| PHP/WordPress/Magento/PrestaShop | `cleanup-php` + `reviewer` |
