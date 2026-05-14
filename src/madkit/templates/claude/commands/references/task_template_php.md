# Plantilla de Tarea: Ecosistemas PHP (PHP/JS/HTML/SQL)

**Fecha de Creación:** YYYY-MM-DD
**Tipo:** [Feature / Enhancement / Fix / Integration / Migration]
**Plataforma:** [Auto-detectada en Paso 1]
**Stack:** PHP / JavaScript / HTML / CSS / SQL
**Complejidad Estimada:** [Simple / Estándar / Compleja / Crítica]

> **Cabecera de Metadatos opcional:** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves).

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

### Pasos 0.1–0.7 — Gestión del documento de tarea

**Delta PHP/Web:**

- **Paso 0.4 — Convención de nombres:** `XXX_camelCaseName.md` (camelCase web). Ubicación: `ai_docs/tasks/XXX_camelCaseName.md`.
- **Paso 0.5 — Verificación rápida antes de presentar:** ¿El análisis exhaustivo de dependencias (sección 1, 4 pasos) reveló riesgos críticos (modificaciones al core, hooks con muchos callbacks)? Si sí → comunicar como observación.
- **Paso 0.7 — Cabecera de seguimiento:** `Creado Por: task_template_php.md`.

---

## 0. Validación Pre-Vuelo y Detección de Plataforma (OBLIGATORIA)

Validar todos los prerequisitos antes de proceder. NO continuar si CUALQUIER validación falla.

### 0.0.1: Prerequisitos de Detección de Plataforma

- Buscar archivos de firma de configuración:
  - WordPress: `wp-config.php`, `wp-content/`, `wp-includes/`
  - Magento: `app/etc/env.php`, `app/code/`, `pub/`
  - PrestaShop: `config/settings.inc.php`, `classes/`, `controllers/`
  - Laravel: `artisan`, `composer.json` con laravel/framework
  - Drupal: `sites/default/settings.php`
  - PHP Personalizado: `config.php`, `index.php`
- Extraer versión de plataforma de archivos de configuración
- Detectar plugins/extensiones clave (WooCommerce, ACF, etc.)

### 0.0.2: Entorno PHP

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

### 0.0.3: Convencion de Nomenclatura

- Confirmar que el proyecto web usa nomenclatura camelCase para archivos de tarea
- Si no es una aplicacion web, redirigir a plantilla apropiada (task_template.md, task_template_python.md, task_template_adk.md)

### 0.0.4: Detección Automática de Plataforma — Protocolo de 5 Pasos

**OBJETIVO:** Identificar exactamente cual plataforma/CMS/framework esta en uso.

**Paso 0.0.4.1: Detección de Archivos de Configuración**

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

**Paso 0.0.4.2: Detección de Estructura de Directorios**

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

**Paso 0.0.4.3: Detección de Base de Datos**

**Información Requerida:**
- Versión del motor DB (MySQL, MariaDB, PostgreSQL)
- Extraer configuración de archivos específicos de plataforma (nombre DB, host, prefijo, charset)
- Seguridad: NO mostrar contrasenas

**DOCUMENTAR:**
- **Motor DB:** [MySQL X.X / MariaDB X.X / PostgreSQL X.X]
- **Nombre DB:** [database_name]
- **Prefijo de tabla:** [wp_ / ps_ / m2_ / custom_]
- **Charset:** [utf8mb4 / utf8 / latin1]

**Paso 0.0.4.4: Detección de Servidor Web**

**Información Requerida:**
- Detectar servidor web en ejecucion (Apache o Nginx) y versión
- Verificar configuración de reescritura de URL: `.htaccess` (Apache) o archivos conf de nginx

**Paso 0.0.4.5: Generar Perfil de Plataforma**

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
- [ ] Archivos de firma de plataforma encontrados
- [ ] Entorno PHP compatible
- [ ] Plataforma identificada y versión determinada
- [ ] Base de datos identificada (motor, nombre, prefijo)
- [ ] Servidor web detectado
- [ ] Estructura de directorios mapeada
- [ ] Convención de nomenclatura confirmada (camelCase)

**REGLA:** Si CUALQUIER item de detección falla, DETENER. No proceder sin perfil de plataforma completo.

---

### 0.0.6 — Triaje de Ingeniería (OBLIGATORIO para ESTÁNDAR+)

**Delta PHP/Web para T1 "Radio de impacto":**

- Unidad de análisis: **archivos PHP, templates, hooks, filtros, tablas DB, módulos/plugins**.
- Prerequisitos típicos: plataforma correcta detectada (Paso 0.0.4) · plugins/módulos activos · versión PHP compatible · permisos de archivo correctos.
- Integración: hooks/filtros nativos disponibles · patrones de la plataforma establecidos · ¿hook nativo o código custom? · ¿plugin o `functions.php`? · ¿override o extensión?
- Estado del codebase: modificaciones al core (CRÍTICO si SI), parches aplicados, deuda técnica histórica.

**Tabla de complejidad (común a todos los stacks, con ajuste PHP/Web):**

| Radio | Complejidad |
|---|---|
| ≤2 archivos en 1 módulo/plugin | SIMPLE |
| 3-6 archivos en 1-2 módulos | ESTÁNDAR |
| 6+ archivos o 3+ módulos/plugins | COMPLEJA |
| Tablas >100K registros / datos producción / modificaciones al core | CRÍTICA |

**Punto de espera T3:** SIMPLE → integrado con presentación final. ESTÁNDAR+ → punto de espera explícito antes de crear documento.

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

---

## 2B. Casos límite mínimos y modos de falla (obligatorio)

**OBLIGATORIO para todas las complejidades (SIMPLE, ESTÁNDAR, COMPLEJA, CRÍTICA).** La sección debe tener ≥3 entradas concretas con respuesta esperada. plan-checker D8 BLOQUEA si artifact ejecutable nuevo sin la sección o <3 entradas concretas.

### Las 3 preguntas mínimas (responder concretamente)

- **Input vacío / null / no existente:** ¿Qué pasa con `$_POST` vacío, meta keys ausentes, queries con `WP_Query` sin resultados?
  **Respuesta esperada:** _[validación con `wp_unslash`, escape, fallback content]_
- **Fallo de dependencia externa:** ¿Qué pasa si una API externa o plugin tercero falla, o BD lenta (>1s)?
  **Respuesta esperada:** _[transient cache, fallback content, error log explícito]_
- **Estado tras error parcial:** ¿Qué pasa si un hook en cadena falla a mitad? ¿Hay nonce / capability check / rollback?
  **Respuesta esperada:** _[verify nonces, current_user_can, transactions cuando aplique]_

Para preguntas adicionales por tipo de artifact, ver **`references/edge-cases-catalog.md`**.

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

---

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

### Criterios de Calidad de Ingeniería (canónicos)

> **Obligatorio si la task toca código ejecutable** (.php/.js/archivos bajo `app/`, `src/`, `wp-content/themes/<tema>/`, `wp-content/plugins/<plugin>/`). Para tasks puramente documentales/config sin runtime, declarar excepción literal `Excepción a Criterios de Calidad de Ingeniería: task no toca código ejecutable (solo <docs/config>).` dentro del cuerpo de la sección "Riesgos aceptados", "Decisiones aceptadas" o "Riesgos y mitigaciones".

- [ ] **Cleanup exhaustivo de comentarios:** archivos modificados sin comentarios narrativos del "qué hace el código", sin TODO/FIXME residual sin issue trackeado, sin código comentado. Verificable: `grep -nE "(TODO|FIXME|XXX)" <archivos>` retorna ≤ baseline previo + `phpcs` sin reportar `Generic.Commenting.Todo`/`Squiz.Commenting.PostStatementComment`. Comentarios permitidos solo cuando explican el WHY no obvio (constraint, invariant, workaround citado).

- [ ] **Sin dead/legacy code:** sin clases/métodos/funciones/imports declarados y nunca referenciados, sin código inalcanzable tras return/throw, sin hooks/filters huérfanos, sin rutas registradas y no usadas. Verificable: `phpstan --level=5` o `psalm` sin nuevos hallazgos en archivos modificados; `grep -r "<símbolo nuevo>"` confirma ≥1 caller (excepto APIs públicas declaradas en docblock).

- [ ] **DRY/KISS/early returns aplicados:** sin bloques de 3+ líneas duplicados entre Controllers/Services (extraer a Service/Action class o citar duplicación existente), sin abstracciones para 1 callsite, sin nesting innecesario donde un early return guard simplifica (validación temprana en controller). Verificable: revisión humana o `reviewer` agent §9, con verdict explícito por archivo modificado.

- [ ] **TDD reutilizando infra existente:** todo código nuevo/modificado tiene test(s) escritos junto al código (no después), reutilizando `TestCase`/`Tests/` (Laravel/PHPUnit), factories existentes en `database/factories/`, o equivalente del proyecto. Verificable: archivo `Tests/Feature/<NombreTest>.php` existe con `extends TestCase` + kill-the-mutant pasa (comentar/invertir línea clave del cambio → al menos 1 test relevante falla). En L0 (sin PHPUnit), declarar como riesgo aceptado o invocar la skill `testing-setup` antes.

**Defense-in-depth automático:** este bloque es validado por hook `task-doc-validator.js` + plan-checker D10 + reviewer §9 + task-implementation-review §10. El `task-planner` Paso 7.4 lo inyecta automáticamente.

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

## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

**Delta PHP/Web (añadir checkboxes):**
- `[ ] Plataforma detectada y perfil generado` (Paso 0.0.4 — perfil completo).
- `[ ] Análisis exhaustivo de dependencias completado (4 pasos: hooks, personalizaciones, mapa, riesgos)`.

---

## Instrucciones para el Agente de IA

Ver sección canónica en `task_template.md` §"Instrucciones canónicas para el Agente de IA". Deltas específicos de PHP:

- **Triaje plataforma:** mapear hooks WP/Magento/PrestaShop afectados antes de planificar; un hook con múltiples callers tiene radio de impacto multiplicado.
- **Compatibilidad multi-versión:** verificar compatibilidad con PHP 7.4+/8.x según el target del proyecto; evitar sintaxis 8.x exclusiva sin fallback.
- **Seguridad:** nonces, sanitización (`sanitize_text_field`, `esc_html`) y capabilities en todas las operaciones que muten datos.

---

## Acciones Prohibidas y Documento Único

---

## Bloque `contract:` (opcional)


---

| Stack | Skill Recomendada |
|-------|-------------------|
| PHP/WordPress/Magento/PrestaShop | `cleanup-php` + `reviewer` |
