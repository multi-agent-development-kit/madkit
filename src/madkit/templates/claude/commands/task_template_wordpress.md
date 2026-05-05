# Plantilla de Desarrollo: WordPress Plugin/Theme

**Fecha de Creación:** YYYY-MM-DD
**Tipo:** [Plugin / Theme / Child Theme / Block]
**Versión de WordPress Objetivo:** 6.8+ (2025-2026)
**PHP Minimo:** 8.2+
**Complejidad Estimada:** [Simple / Estándar / Compleja / Crítica]

> **Cabecera de Metadatos opcional (T079):** los task docs pueden incluir cabecera blockquote con `> **Depende de:**`, `> **Asunciones:**` y sub-sección "Wiring esperado" para el flujo `task-planner` Paso 0.6 (waves). Ver documentación completa en [`task_template.md`](task_template.md) §"Cabecera de Metadatos del Task Doc (opcional)" — esta plantilla hereda esa especificación.

---

## CRÍTICO: Protocolo de Creación de Documentos de Tarea

**Esta plantilla crea un DOCUMENTO DE PLANIFICACIÓN únicamente. NO implementar cambios directamente.**

---

## CLASIFICACIÓN DE COMPLEJIDAD DE TAREA - LEE ESTO PRIMERO

<!-- AI Agent: Determina la complejidad ANTES de crear el documento de tarea. La mayoría de tareas son SIMPLE. -->

### TAREA SIMPLE (Usa PASO 0,1,3,9 solamente - ~150 líneas)

**Criterios — TODOS deben ser verdaderos:**
- Cambio en un solo archivo (función, hook, template)
- Sin cambios en base de datos (sin tablas custom, sin opciones nuevas)
- Sin nuevos bloques Gutenberg
- Limitado a 1-2 archivos
- Requisitos claros e inequívocos

**Ejemplos:**
- Agregar filtro a hook existente
- Modificar template de tema
- Actualizar estilos CSS de componente
- Corregir función PHP en plugin

### TAREA ESTÁNDAR (Usa PASO 0-5,9 - ~400 líneas)

**Criterios — CUALQUIERA activa ESTÁNDAR:**
- Nuevo shortcode o bloque Gutenberg simple
- Endpoints REST API personalizados
- Cambios en base de datos (opciones, post meta)
- 3-5 archivos afectados
- Integración de plugin/servicio externo

**Ejemplos:**
- Crear bloque Gutenberg con block.json
- Implementar endpoint REST API personalizado
- Agregar pagina de configuración en admin
- Integrar servicio externo via API

### TAREA COMPLEJA (Usa todos los PASOS - ~600+ líneas)

**Criterios — CUALQUIERA activa COMPLEJA:**
- Custom Post Types con meta boxes complejos
- Tablas de base de datos personalizadas
- Sistema de permisos/capabilities personalizado
- 6+ archivos afectados
- Bloque Gutenberg dinamico con editor React completo

**Ejemplos:**
- Plugin completo con CPT, taxonomias y REST API
- Sistema de pagos con WooCommerce hooks
- Block theme con theme.json, patterns y templates

### TAREA CRÍTICA (Usa todos los PASOS + plan de rollback obligatorio - ~800+ líneas)

**Criterios — CUALQUIERA activa CRÍTICA:**
- Cambios en tablas con datos de producción
- Migraciones de datos entre versiones
- Cambios en sistema de autenticacion WP
- Cambios que afectan multisite
- Cambios en WooCommerce checkout/pagos

**Ejemplos:**
- Migrar datos entre versiones de plugin con >10K registros
- Modificar flujo de checkout de WooCommerce
- Implementar SSO personalizado
- Migrar de tema clasico a Block Theme en producción

---

### 0.0.6 — Triaje de Ingeniería (OBLIGATORIO para ESTÁNDAR+)

<!-- AI Agent: Para tareas SIMPLE (<=2 archivos), el triaje es mental. Para ESTÁNDAR+, es conversación explícita con el usuario. -->

**T1: Analizar** — Examinar el codebase para responder:

- **Radio de impacto:** ¿Cuántos archivos PHP, templates, hooks, shortcodes, CPTs se ven afectados?
  - <=2 archivos en 1 plugin/theme → SIMPLE
  - 3-6 archivos en 1-2 plugins → ESTÁNDAR
  - 6+ archivos o 3+ plugins/themes → COMPLEJA
  - Core modifications, datos producción, prerequisitos bloqueantes → CRÍTICA
- **Prerequisitos:** ¿Theme activo correcto? ¿Plugins necesarios activos? ¿Versión WP compatible? Trazar dependencias (max 2 niveles). ✅ existe | ❌ falta.
- **Integración:** ¿Hay hooks/filtros nativos de WordPress que resuelven esto? ¿Patrones del theme/plugin establecidos?
- **Stack-specific:** ¿Plugin o functions.php? ¿Hook existente o custom? ¿Shortcode o bloque Gutenberg? Verificar antes de planificar.

**T2: Cuestionar (solo si hay razón):**

- Alcance cubre 2+ funcionalidades independientes → proponer desglose
- Existe hook/filtro nativo de WordPress → proponerlo en lugar de código custom
- Prerequisitos bloqueantes (plugins faltantes, versión WP) → proponer resolverlos primero
- Sobre-diseño detectado → proponer simplificación (KISS)

**T3: Alinear** — Para ESTÁNDAR+, presentar al usuario:

```
Alcance: [1-2 frases]
Complejidad: [nivel] — [N archivos, M plugins]
Prerequisitos: [lista si hay] / Ninguno detectado
¿Confirmas este alcance para crear el documento de tarea?
```

**PUNTO DE ESPERA:** Para ESTÁNDAR+, esperar confirmación antes de proceder.

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

**Reglas:** Secuencia global compartida, siempre 3 dígitos, cada número se usa EXACTAMENTE UNA VEZ. El número `000` está RESERVADO para calibración del proyecto — nunca usar para tareas normales.

---

### Paso 0.4: Crear Documento de Tarea

**CRÍTICO: UNA tarea = UN archivo. UN número = UN archivo. Sin excepciones.**

**Convención de Nombres para WordPress:**
- **Formato:** `XXX_camelCaseName.md`
- **Convención:** camelCase (WordPress)
- **Ubicación:** `ai_docs/tasks/XXX_camelCaseName.md`
- **Verificar:** NO exista un archivo con ese prefijo de número

---

### Paso 0.5: Presentar Documento de Tarea al Usuario

**NOTA:** El análisis crítico de impacto, prerequisitos y alcance ya se realizó en el Triaje de Ingeniería (Paso 0.0.6). Aquí se presenta el documento ya validado.

**Verificación rápida antes de presentar:**
- ¿El documento refleja el alcance validado en T3? Si no → actualizar.
- ¿Se descubrió algo nuevo durante el análisis? Si sí → comunicar como observación.

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

**Convención de Nomenclatura:** `XXX_camelCaseName.md` (camelCase para proyectos WordPress)

**Agregar sección de seguimiento:**
```markdown
## Seguimiento del Ciclo de Vida de Tarea
### Creación
- **Creado:** [timestamp]
- **Creado Por:** task_template_wordpress.md
- **Complejidad Inicial:** [Simple | Estándar | Compleja | Crítica]
### Revisiones / Progreso de Implementación / Estado de Finalización
[Actualizar durante ciclo de vida]
```

---

## PRINCIPIOS FUNDAMENTALES DE DESARROLLO WORDPRESS MODERNO

**ESTA PLANTILLA ASEGURA:**
- Uso de APIs actuales de WordPress (2024-2025)
- Cero funciones deprecadas
- Funciones nativas primero (no reinventar la rueda)
- Seguridad en cada punto (sanitize, escape, nonces, capabilities)
- Codigo compatible con Block Editor (Gutenberg)
- Cumplimiento de WordPress Coding Standards (WPCS)
- Minima deuda técnica, maxima escalabilidad

**REGLA DE ORO:** "Si WordPress lo hace nativamente, usa la función de WordPress. NO la reimplementes."

### APIs Modernas de WordPress (6.6+)

**Verificar disponibilidad antes de planificar:**
- **theme.json v3** (WP 6.6+): per-block default styles, shadow definitions, fluid typography, border radius presets
- **Block Bindings API** (WP 6.6+): conectar atributos de bloques a datos dinámicos (custom fields, post meta, APIs externas). Reemplaza meta boxes para muchos casos
- **Interactivity API** (WP 6.5+): gestión de estado JS nativa — reemplaza patrones jQuery. Estado reactivo sin bundlers externos
- **Commands API** (`useCommands` hook): comandos custom en command palette del admin (Cmd+K)

**Starter Themes — estado actual:**
- ❌ **Underscores (_s)**: ARCHIVADO — Automattic lo abandonó en favor de Block Themes
- ✅ **Blockbase** (Automattic): block theme oficial, FSE support
- ✅ **Sage** (Roots): híbrido moderno, build tools, actively maintained
- ✅ **_tw**: fork de Underscores con Tailwind CSS

**Plugin Boilerplates recomendados:**
- **WPBP** (github.com/WPBP/WordPress-Plugin-Boilerplate-Powered): PSR-4, code generator
- **wppb.me**: generador web de boilerplate personalizado

---

## PASO 0.1: Verificación de Versión y APIs Actuales (OBLIGATORIO)

### Validación Pre-Vuelo

**Paso 0.1: Verificar Versión de WordPress Instalada**

**Información Requerida:**
- Versión de WordPress (de `wp-includes/version.php` o `wp core version`)
- Versión de PHP (`php -v`)
- Versión de MySQL/MariaDB

**DOCUMENTAR:**
- **Versión WordPress:** [6.8.x / 6.9 / etc.]
- **Versión PHP:** [8.2 / 8.3 / 8.4]
- **Versión MySQL:** [8.0 / MariaDB 10.6]

**Paso 0.2: Consultar Documentacion Oficial**

La IA puede tener conocimiento desactualizado. SIEMPRE verificar contra fuentes oficiales:
- Funciones: https://developer.wordpress.org/reference/functions/
- Hooks: https://developer.wordpress.org/reference/hooks/
- Clases: https://developer.wordpress.org/reference/classes/
- Block Editor: https://developer.wordpress.org/block-editor/
- REST API: https://developer.wordpress.org/rest-api/
- Estandares de Codigo: https://developer.wordpress.org/coding-standards/wordpress-coding-standards/

**Paso 0.3: Detectar Funciones Deprecadas a Evitar**

Buscar funciones deprecadas en el codebase y documentar reemplazos:

```markdown
## FUNCIONES PROHIBIDAS (Deprecadas/Inseguras)
- create_function() -> Usar: function() {}
- mysql_query() -> Usar: $wpdb->query()
- wp_specialchars() -> Usar: esc_html()
- get_page() -> Usar: get_post()
- the_author_email() -> Usar: get_the_author_meta('email')
- [Agregar mas segun deteccion]
```

**Paso 0.4: Verificar APIs Modernas Disponibles**

Verificar cuales APIs estan disponibles en la versión actual:
- Block Editor API: `function_exists('register_block_type')`
- REST API: `function_exists('register_rest_route')`
- Application Passwords: `class_exists('WP_Application_Passwords')`
- Site Health API: `function_exists('wp_get_site_health_info')`

**Paso 0.5: Configurar Entorno de Desarrollo**

**Información Requerida:**
- wp-cli instalado y versión
- WPCS configurado via Composer
- WP_DEBUG, WP_DEBUG_LOG, SCRIPT_DEBUG habilitados
- Plugin Query Monitor activo

**CHECKLIST DE VERIFICACION (TODOS deben pasar):**
- [ ] Versión WordPress >= 6.8
- [ ] Versión PHP >= 8.2
- [ ] Documentacion oficial consultada para funciones clave
- [ ] Lista de funciones deprecadas documentada
- [ ] APIs modernas identificadas
- [ ] Entorno de desarrollo configurado

**REGLA:** Si CUALQUIER verificación falla, DETENER. Actualizar WordPress/PHP o ajustar requisitos.

---

## PASO 0B: Análisis de Alternativas de Implementación

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, documentar brevemente por que solo hay un enfoque viable.**

> Despues de verificar el entorno, explorar MULTIPLES enfoques ANTES de comprometerse con uno. WordPress ofrece multiples caminos para cada funcionalidad — elegir mal al inicio genera deuda técnica dificil de revertir en un CMS en producción.

### Criterio de Activación

Realizar análisis completo si se cumplen 2+ criterios:
- [ ] Multiples patrónes WordPress viables (plugin vs theme function, shortcode vs block, custom post type vs taxonomy, etc.)
- [ ] Funcionalidad que podria resolverse con un plugin existente vs desarrollo custom
- [ ] Cambios en base de datos (tablas custom vs post meta vs options)
- [ ] Impacto en SEO, rendimiento o compatibilidad con otros plugins
- [ ] Modificaciones que afectan el tema activo en producción

### Alternativas (Minimo 2, idealmente 3)

**Alternativa 1: [Nombre descriptivo]**
- **Enfoque**: [Descripción breve — que patrón WordPress, que APIs]
- **Estructura**: [Plugin / Theme function / Block / Shortcode / Widget]
- **Pros**: [2-3 ventajas concretas]
- **Contras**: [2-3 desventajas concretas]
- **Complejidad**: Baja / Media / Alta
- **Riesgo**: [Que puede salir mal, compatibilidad con otros plugins/temas]

**Alternativa 2: [Nombre descriptivo]**
- [Misma estructura]

**Alternativa 3 (si aplica): [Nombre descriptivo]**
- [Misma estructura]

### Matriz de Compromisos

| Factor | Alt 1 | Alt 2 | Alt 3 | Ganador |
|--------|-------|-------|-------|---------|
| **Complejidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Mantenibilidad** | B/M/A | B/M/A | B/M/A | [ ] |
| **Compatibilidad** (plugins/temas) | B/M/A | B/M/A | B/M/A | [ ] |
| **Rendimiento** | B/M/A | B/M/A | B/M/A | [ ] |
| **Escalabilidad** | B/M/A | B/M/A | B/M/A | [ ] |

### Decisión y Justificación

**Seleccionado**: Alternativa [X] — [Nombre]

**Justificación**:
1. **Razón Principal**: [Por que es la mejor opcion para ESTE sitio WordPress]
2. **Compromiso Aceptado**: [Que se sacrifica y por que es aceptable]

**Alternativas Rechazadas**:
- Alternativa [Y]: Rechazada porque [razón concreta]

### DECISIÓN DEL USUARIO REQUERIDA

Presentar las alternativas al usuario. **Esperar aprobación antes de proceder con la estructura e implementación.**

---

## PASO 0C: Análisis de Modos de Falla y Casos Extremos

**OBLIGATORIO para tareas ESTÁNDAR o superior. Para SIMPLE, omitir esta sección.**

> Antes de disenar la implementación, analizar sistematicamente que puede salir mal. En WordPress, los fallos mas comunes vienen de conflictos con otros plugins, temas que sobreescriben estilos, y datos de usuario impredecibles.

### Escenarios de Falla

| Componente/Flujo | Escenario de Falla | Impacto | Probabilidad | Mitigacion |
|-------------------|-------------------|---------|--------------|------------|
| [Hook/Filter] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Custom DB Table] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |
| [Block/Shortcode] | [Que sale mal] | A/M/B | A/M/B | [Como manejar] |

### Preguntas Obligatorias de Edge Cases

- [ ] **Conflictos de plugins**: Otro plugin podria hookear la misma accion/filtro y romper la funcionalidad?
- [ ] **Compatibilidad de tema**: El tema activo podria sobreescribir estilos o templates que usamos?
- [ ] **Inputs de usuario**: Que pasa con contenido HTML malformado, caracteres especiales, campos vacios en formularios?
- [ ] **Multisite**: El código funciona correctamente en instalaciones multisite?
- [ ] **Cache de pagina**: Plugins de cache (WP Super Cache, W3TC, etc.) podrian servir contenido obsoleto?
- [ ] **Traducciones**: Los strings estan correctamente wrapeados con i18n? Funcionan con plugins de traducción?
- [ ] **Actualizaciones de WP**: El código usa funciones que podrian deprecarse en la proxima versión?
- [ ] **Volumen de datos**: Que pasa si hay 10K+ posts/usuarios? Las queries son eficientes?
- [ ] **Permisos de usuario**: Roles diferentes (admin, editor, author, subscriber) ven/hacen lo correcto?

### Fallas Críticas (Alto Impacto + Alta Probabilidad)
- [Listar las que requieren mitigacion obligatoria]

### Riesgos Aceptados (Bajo Impacto o Baja Probabilidad)
- [Listar con justificación]

---

## PASO 0D: Estrategia de Rollback (OBLIGATORIO para COMPLEJA/CRÍTICA)

Cada tarea COMPLEJA o CRÍTICA DEBE incluir un plan de rollback:

### Si el cambio de código rompe funcionalidad:
1. Desactivar plugin modificado desde admin o renombrar carpeta
2. Restaurar archivos desde backup: `tar -xzf backup_files_TIMESTAMP.tar.gz`
3. Limpiar cache de WordPress: `wp cache flush`

### Si la migración de base de datos falla:
1. Restaurar desde backup: `mysql -u user -p db_name < backup_db_TIMESTAMP.sql`
2. Verificar integridad con WP-CLI: `wp db check`
3. Verificar funcionalidad en navegador

### Si el tema se rompe:
1. Activar tema por defecto: `wp theme activate twentytwentyfour`
2. Restaurar archivos del tema desde backup
3. Verificar que el sitio carga correctamente

**Documentar:**
- **Disparadores de rollback:** [Que condiciones activan el rollback]
- **Tiempo estimado de rollback:** [Minutos/horas]
- **Datos en riesgo:** [Que datos podrian perderse]
- **Verificación post-rollback:** [Como confirmar éxito]

---

## PASO 1: Estructura y Configuración Inicial

### Para Plugin

**Estructura de Archivos Moderna:**
```
my-plugin/
+-- my-plugin.php              # Archivo principal
+-- README.md
+-- package.json               # Para assets (bloques Gutenberg)
+-- composer.json               # Dependencias PHP
+-- phpcs.xml.dist             # Reglas WPCS
+-- /assets/css/, /js/, /images/
+-- /blocks/                    # Bloques Gutenberg
|   +-- /block-name/
|       +-- block.json, edit.js, save.js, style.css
+-- /includes/                  # Clases PHP
|   +-- /Admin/, /Frontend/, /Blocks/, /API/
+-- /languages/my-plugin.pot
+-- /tests/bootstrap.php, test-*.php
```

**Header del Plugin (Formato 2024):**
```php
<?php
/**
 * Plugin Name:       My Modern Plugin
 * Plugin URI:        https://example.com/my-plugin
 * Description:       Plugin description following modern WordPress standards.
 * Versión:           1.0.0
 * Requires at least: 6.8
 * Requires PHP:      8.2
 * Author:            Your Name
 * Author URI:        https://example.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-plugin
 * Domain Path:       /languages
 * Update URI:        https://example.com/my-plugin/updates
 *
 * @package           My_Plugin
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

define( 'MY_PLUGIN_VERSION', '1.0.0' );
define( 'MY_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
define( 'MY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MY_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

register_activation_hook( __FILE__, function() {
    require_once MY_PLUGIN_PATH . 'includes/class-activator.php';
    My_Plugin\Activator::activate();
});

register_deactivation_hook( __FILE__, function() {
    require_once MY_PLUGIN_PATH . 'includes/class-deactivator.php';
    My_Plugin\Deactivator::deactivate();
});

require MY_PLUGIN_PATH . 'includes/class-main.php';

function run_my_plugin() {
    $plugin = new My_Plugin\Main();
    $plugin->run();
}
run_my_plugin();
```

### Para Theme

**Estructura Moderna de Block Theme (WordPress 6.0+):**
```
my-theme/
+-- style.css                   # Metadata del tema
+-- functions.php
+-- screenshot.png             # 1200x900px
+-- theme.json                 # Configuración global (FSE)
+-- package.json
+-- /assets/css/, /js/, /images/
+-- /inc/                      # Funciones personalizadas
|   +-- customizer.php, template-functions.php, block-patterns.php
+-- /parts/                    # Partes de template (FSE)
|   +-- header.html, footer.html, sidebar.html
+-- /patterns/                 # Patrones de bloques
|   +-- header-default.php, footer-default.php
+-- /templates/                # Templates de bloques (FSE)
|   +-- index.html, single.html, page.html, archive.html
+-- /styles/dark.json          # Variaciones de estilo
+-- /languages/my-theme.pot
```

**Header de style.css:**
```css
/*
Theme Name:        My Modern Theme
Theme URI:         https://example.com/my-theme
Author:            Your Name
Author URI:        https://example.com
Description:       Modern block-based theme (FSE) with theme.json.
Versión:           1.0.0
Requires at least: 6.8
Tested up to:      6.9
Requires PHP:      8.2
License:           GNU General Public License v2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:       my-theme
Tags:              block-themes, full-site-editing, accessibility-ready, custom-colors
*/
```

**theme.json (Configuración Global y Estilos):**
```json
{
  "$schema": "https://schemas.wp.org/wp/6.8/theme.json",
  "version": 2,
  "settings": {
    "appearanceTools": true,
    "useRootPaddingAwareAlignments": true,
    "color": {
      "defaultPalette": false,
      "custom": true,
      "palette": [
        { "slug": "primary", "color": "#0073aa", "name": "Primary" },
        { "slug": "secondary", "color": "#23282d", "name": "Secondary" }
      ]
    },
    "typography": {
      "customFontSize": true,
      "fontFamilies": [
        { "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", "slug": "system-fonts", "name": "System Fonts" }
      ],
      "fontSizes": [
        { "slug": "small", "size": "14px", "name": "Small" },
        { "slug": "medium", "size": "18px", "name": "Medium" },
        { "slug": "large", "size": "24px", "name": "Large" }
      ]
    },
    "layout": { "contentSize": "800px", "wideSize": "1200px" }
  },
  "styles": {
    "color": { "background": "#ffffff", "text": "#23282d" },
    "typography": { "fontSize": "var(--wp--preset--font-size--medium)", "lineHeight": "1.6" },
    "spacing": { "blockGap": "1.5rem" }
  }
}
```

---

## PASO 2: Protocolo de Uso de Funciones Nativas de WordPress

### Regla de Buscar Antes de Implementar

Antes de escribir CUALQUIER función personalizada:
1. Buscar si WordPress ya lo hace (grep fuente, verificar developer.wordpress.org)
2. Si existe función nativa: USARLA, no reimplementar
3. Si no existe función nativa: Verificar si hay un hook/filtro para extender
4. Solo entonces: Implementar personalizado (siguiendo WPCS)

### Funciones Nativas Modernas por Categoría

#### Sanitizacion y Validación (SIEMPRE usar)

```php
<?php
// Sanitizacion de Entrada (OBLIGATORIO para toda entrada de usuario)
$text     = sanitize_text_field( $_POST['field_name'] );
$textarea = sanitize_textarea_field( $_POST['textarea'] );
$email    = sanitize_email( $_POST['email'] );
$url      = sanitize_url( $_POST['url'] );         // WordPress 6.0+
$title    = sanitize_title( $_POST['title'] );
$filename = sanitize_file_name( $_FILES['file']['name'] );
$html     = wp_kses_post( $_POST['content'] );     // Permitir tags seguros
$meta_key = sanitize_key( $_POST['meta_key'] );
$class    = sanitize_html_class( $_POST['class_name'] );
// NUNCA: $unsafe = $_POST['data']; // VULNERABLE
```

#### Escapado de Salida (SIEMPRE usar)

```php
<?php
echo esc_html( $text );                              // HTML general
echo '<div class="' . esc_attr( $class ) . '">';     // Atributos
echo '<a href="' . esc_url( $url ) . '">';           // URLs
echo '<script>var data = ' . wp_json_encode( $data ) . ';</script>';  // JS
echo '<textarea>' . esc_textarea( $content ) . '</textarea>';
echo wp_kses_post( $html_content );                  // HTML con tags seguros
// NUNCA: echo $user_input; // VULNERABILIDAD XSS
```

#### Base de Datos ($wpdb - Siempre usar prepared statements)

```php
<?php
global $wpdb;

// SELECT
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}my_table WHERE user_id = %d AND status = %s",
        $user_id, $status
    )
);

// INSERT
$wpdb->insert(
    $wpdb->prefix . 'my_table',
    array( 'column1' => $value1, 'column2' => $value2 ),
    array( '%s', '%d' )
);

// UPDATE
$wpdb->update(
    $wpdb->prefix . 'my_table',
    array( 'column1' => $new_value ),
    array( 'ID' => $id ),
    array( '%s' ), array( '%d' )
);

// DELETE
$wpdb->delete( $wpdb->prefix . 'my_table', array( 'ID' => $id ), array( '%d' ) );

// NUNCA: $wpdb->query( "SELECT * FROM table WHERE id = $id" ); // INYECCION SQL
```

#### Nonces (Verificación CSRF - OBLIGATORIO)

```php
<?php
// Crear nonce en formulario
wp_nonce_field( 'my_action_name', 'my_nonce_name' );

// Verificar nonce antes de procesar
if ( ! isset( $_POST['my_nonce_name'] )
    || ! wp_verify_nonce( $_POST['my_nonce_name'], 'my_action_name' ) ) {
    wp_die( 'Unauthorized action', 'Security error', array( 'response' => 403 ) );
}

// Nonce AJAX
$nonce = wp_create_nonce( 'my_ajax_action' );
check_ajax_referer( 'my_ajax_action', 'nonce' );  // Verificar en handler

// Nonce URL
$url = wp_nonce_url( $base_url, 'my_action', 'nonce_param' );
```

#### Capabilities (Permisos - SIEMPRE verificar)

```php
<?php
if ( ! current_user_can( 'edit_posts' ) ) {
    wp_die( 'Insufficient permissions' );
}
if ( ! current_user_can( 'edit_post', $post_id ) ) {
    wp_die( 'Cannot edit this post' );
}

// Capabilities comunes:
// manage_options (Admin), edit_posts (Editor+), publish_posts (Author+), read (Subscriber+)
// NUNCA confiar solo en is_admin() -- NO es verificación de permisos
```

#### Solicitudes HTTP (Usar WP HTTP API)

```php
<?php
$response = wp_remote_get( 'https://api.example.com/data' );
if ( is_wp_error( $response ) ) {
    $error_message = $response->get_error_message();
} else {
    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body );
}

$response = wp_remote_post( 'https://api.example.com/endpoint', array(
    'headers' => array( 'Content-Type' => 'application/json', 'Authorization' => 'Bearer ' . $token ),
    'body'    => wp_json_encode( $data ),
    'timeout' => 45,
));
// NUNCA usar curl directamente -- usar wp_remote_*
```

#### Sistema de Archivos (Usar WP Filesystem API)

```php
<?php
global $wp_filesystem;
if ( empty( $wp_filesystem ) ) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    WP_Filesystem();
}
$content = $wp_filesystem->get_contents( $file_path );
$wp_filesystem->put_contents( $file_path, $content, FS_CHMOD_FILE );
wp_mkdir_p( $directory_path );
// NUNCA usar file_get_contents/file_put_contents directamente
```

#### Cache (Transients API)

```php
<?php
set_transient( 'my_data_key', $data, 12 * HOUR_IN_SECONDS );
$data = get_transient( 'my_data_key' );
if ( false === $data ) {
    $data = expensive_function();
    set_transient( 'my_data_key', $data, 12 * HOUR_IN_SECONDS );
}
delete_transient( 'my_data_key' );
// Para datos persistentes: update_option( 'key', $value, 'no' ); // 'no' = sin autoload
```

#### Encolar Scripts y Estilos (Metodo Correcto)

```php
<?php
add_action( 'wp_enqueue_scripts', 'my_plugin_enqueue_assets' );
function my_plugin_enqueue_assets() {
    wp_enqueue_style( 'my-plugin-style', MY_PLUGIN_URL . 'assets/css/style.css', array(), MY_PLUGIN_VERSION );
    wp_enqueue_script( 'my-plugin-script', MY_PLUGIN_URL . 'assets/js/script.js', array( 'jquery' ), MY_PLUGIN_VERSION, true );
    wp_localize_script( 'my-plugin-script', 'myPluginData', array(
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'my_ajax_action' ),
        'strings'  => array( 'error' => __( 'Error processing', 'my-plugin' ) ),
    ));
}
// Para admin: add_action( 'admin_enqueue_scripts', 'my_plugin_admin_assets' );
// NUNCA scripts inline en templates ni echo de vars PHP crudos en JS
```

---

## PASO 3: Checklist de Seguridad

### Verificación de Seguridad OBLIGATORIA

**1. Validación y Sanitizacion de Entrada (CRÍTICO)**
- [ ] TODOS los `$_POST`, `$_GET`, `$_REQUEST` sanitizados con función apropiada
- [ ] Archivos subidos validados con `wp_check_filetype_and_ext()`
- [ ] Tipos de datos de formulario verificados

**2. Escapado de Salida (CRÍTICO)**
- [ ] TODOS los `echo` con variables usan esc_html(), esc_attr(), esc_url()
- [ ] Contenido HTML usa wp_kses_post() o wp_kses()
- [ ] JavaScript usa wp_json_encode()

**3. Nonces y CSRF (CRÍTICO)**
- [ ] TODOS los formularios tienen wp_nonce_field()
- [ ] TODO procesamiento verifica nonce con wp_verify_nonce()
- [ ] AJAX usa check_ajax_referer()
- [ ] Nonces únicos por accion

**4. Capabilities (CRÍTICO)**
- [ ] Funciones admin verifican current_user_can()
- [ ] AJAX verifica permisos ademas de nonce
- [ ] Permisos verificados para posts específicos: current_user_can('edit_post', $id)

**5. Base de Datos (CRÍTICO - Inyeccion SQL)**
- [ ] TODAS las consultas usan $wpdb->prepare()
- [ ] Placeholders correctos: %s strings, %d integers, %f floats
- [ ] Prefijo de tabla: $wpdb->prefix
- [ ] SIN concatenacion de strings en consultas

**6. Sistema de Archivos**
- [ ] Uploads validados (tipo, tamaño), path traversal prevenido
- [ ] WP_Filesystem API usado en lugar de funciones PHP directas

**7. APIs Externas**
- [ ] WP HTTP API usado (wp_remote_get/post)
- [ ] Respuestas validadas con is_wp_error()
- [ ] API keys no hardcoded

**8. Internacionalizacion (i18n)**
- [ ] Todos los strings usan __(), _e(), esc_html__(), esc_html_e()
- [ ] Text domain correcto coincide con header del plugin/theme
- [ ] Variables en traducciones usan placeholders sprintf()

```php
// CORRECTO:
printf( esc_html__( 'Hello %s', 'my-plugin' ), $name );
// INCORRECTO:
echo __( 'Hello ' . $name, 'my-plugin' ); // NO concatenar
```

**REGLA DE SEGURIDAD:** Cualquier vulnerabilidad CRÍTICA = RECHAZADO. No proceder.

---

## PASO 4: WordPress Coding Standards (WPCS)

### Verificación Automatica

```bash
phpcs --standard=WordPress .
phpcbf --standard=WordPress .  # Auto-corregir problemas menores
```

**REGLA:** CERO errores WPCS antes de commit.

**Patrones Comunes:**
```php
<?php
// Espaciado CORRECTO:
if ( $condition ) { echo 'test'; }
function my_function( $param1, $param2 ) { }

// Condiciones Yoda CORRECTAS:
if ( 'value' === $variable ) { }

// Ternario CORRECTO:
$var = $condition ? 'yes' : 'no';

// NUNCA usar extract()
$var = $array['key'];  // Acceder directamente
```

---

## PASO 5: Bloques Gutenberg (Block Editor)

### Desarrollo Moderno de Bloques (2024)

**Scaffolding:**
```bash
npx @wordpress/create-block@latest my-block
```

**block.json (Metadata v2 - Obligatorio):**
```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersión": 3,
  "name": "my-plugin/my-block",
  "version": "1.0.0",
  "title": "My Block",
  "category": "widgets",
  "icon": "smiley",
  "description": "Block description",
  "textdomain": "my-plugin",
  "attributes": {
    "content": { "type": "string", "source": "html", "selector": "p" },
    "alignment": { "type": "string", "default": "left" }
  },
  "supports": {
    "html": false,
    "align": true,
    "color": { "background": true, "text": true },
    "spacing": { "padding": true, "margin": true },
    "typography": { "fontSize": true, "lineHeight": true }
  },
  "editorScript": "file:./index.js",
  "editorStyle": "file:./index.css",
  "style": "file:./style-index.css"
}
```

**Registrar Bloque en PHP:**
```php
<?php
add_action( 'init', 'my_plugin_register_blocks' );
function my_plugin_register_blocks() {
    register_block_type( __DIR__ . '/blocks/my-block' );  // Auto desde block.json
}

// Bloque dinamico con render callback
register_block_type( __DIR__ . '/blocks/my-block', array(
    'render_callback' => 'my_plugin_render_block',
));

function my_plugin_render_block( $attributes, $content, $block ) {
    $content = isset( $attributes['content'] ) ? $attributes['content'] : '';
    return sprintf( '<div class="my-block">%s</div>', wp_kses_post( $content ) );
}
```

**edit.js (Editor React):**
```jsx
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
    const { content, alignment } = attributes;
    return (
        <>
            <InspectorControls>
                <PanelBody title={ __( 'Settings', 'my-plugin' ) }>
                    <SelectControl
                        label={ __( 'Alignment', 'my-plugin' ) }
                        value={ alignment }
                        options={ [
                            { label: 'Left', value: 'left' },
                            { label: 'Center', value: 'center' },
                            { label: 'Right', value: 'right' },
                        ] }
                        onChange={ ( value ) => setAttributes( { alignment: value } ) }
                    />
                </PanelBody>
            </InspectorControls>
            <div { ...useBlockProps() }>
                <RichText
                    tagName="p"
                    value={ content }
                    onChange={ ( value ) => setAttributes( { content: value } ) }
                    placeholder={ __( 'Write content...', 'my-plugin' ) }
                    style={ { textAlign: alignment } }
                />
            </div>
        </>
    );
}
```

**save.js (Frontend):**
```jsx
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
    const { content, alignment } = attributes;
    return (
        <div { ...useBlockProps.save() }>
            <RichText.Content tagName="p" value={ content } style={ { textAlign: alignment } } />
        </div>
    );
}
```

**Build con @wordpress/scripts:**
```json
{
  "scripts": { "build": "wp-scripts build", "start": "wp-scripts start", "lint:js": "wp-scripts lint-js" },
  "devDependencies": { "@wordpress/scripts": "^27.0.0" }
}
```

---

## PASO 6: REST API (Endpoints Personalizados)

### Endpoints Modernos y Seguros

```php
<?php
add_action( 'rest_api_init', 'my_plugin_register_api_routes' );
function my_plugin_register_api_routes() {
    // Endpoint GET
    register_rest_route( 'my-plugin/v1', '/data/(?P<id>\d+)', array(
        'methods'             => 'GET',
        'callback'            => 'my_plugin_get_data',
        'permission_callback' => '__return_true',  // Lectura publica
        'args' => array(
            'id' => array(
                'validate_callback' => function( $param ) { return is_numeric( $param ); },
                'sanitize_callback' => 'absint',
            ),
        ),
    ));

    // Endpoint POST
    register_rest_route( 'my-plugin/v1', '/data', array(
        'methods'             => 'POST',
        'callback'            => 'my_plugin_create_data',
        'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        'args' => array(
            'title'   => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
            'content' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ),
        ),
    ));
}

function my_plugin_get_data( WP_REST_Request $request ) {
    $data = get_post( $request->get_param( 'id' ) );
    if ( ! $data ) {
        return new WP_Error( 'no_data', __( 'Not found', 'my-plugin' ), array( 'status' => 404 ) );
    }
    return rest_ensure_response( array(
        'id' => $data->ID, 'title' => $data->post_title, 'content' => $data->post_content,
    ));
}

function my_plugin_create_data( WP_REST_Request $request ) {
    $post_id = wp_insert_post( array(
        'post_title'   => $request->get_param( 'title' ),
        'post_content' => $request->get_param( 'content' ),
        'post_status'  => 'publish',
        'post_type'    => 'post',
    ));
    if ( is_wp_error( $post_id ) ) {
        return new WP_Error( 'create_failed', __( 'Error creating', 'my-plugin' ), array( 'status' => 500 ) );
    }
    return rest_ensure_response( array( 'id' => $post_id, 'message' => __( 'Created', 'my-plugin' ) ) );
}
```

**Consumir REST API desde JavaScript:**
```javascript
import apiFetch from '@wordpress/api-fetch';

// GET
apiFetch( { path: '/my-plugin/v1/data/123' } ).then( console.log ).catch( console.error );

// POST
apiFetch( {
    path: '/my-plugin/v1/data',
    method: 'POST',
    data: { title: 'New title', content: 'New content' },
}).then( ( r ) => console.log( r.message ) ).catch( console.error );
```

---

## PASO 7: Pruebas y Depuración

### Pruebas Unitarias con PHPUnit

```bash
bash bin/install-wp-tests.sh wordpress_test root '' localhost latest
phpunit
phpunit --coverage-html coverage/
```

**Ejemplo de Prueba:**
```php
<?php
class Test_My_Plugin extends WP_UnitTestCase {
    public function test_sanitization() {
        $this->assertEquals( 'Text', sanitize_text_field( '<script>alert("xss")</script>Text' ) );
    }
    public function test_custom_function() {
        $this->assertTrue( is_string( my_plugin_custom_function( 'input' ) ) );
    }
}
```

### Configuración de Depuración

```php
<?php
// En wp-config.php (solo desarrollo)
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', true );
define( 'SAVEQUERIES', true );

// Logging
error_log( 'Debug: ' . print_r( $variable, true ) );
do_action( 'qm/debug', $variable );  // Con Query Monitor
```

---

## PASO 8: Reducción de Deuda Técnica

### Checklist de Mantenibilidad

**Codigo Limpio:**
- [ ] Funciones pequenas (< 50 líneas)
- [ ] Nombres descriptivos para variables y funciones
- [ ] Sin código muerto comentado en archivos modificados (reportar hallazgos, no eliminar sin confirmación)
- [ ] Sin TODOs sin resolver en archivos modificados (TODOs preexistentes fuera de alcance)
- [ ] DRY en archivos modificados (si se detecta duplicación → reportar, no extraer automáticamente)

**Documentacion:**
```php
<?php
/**
 * Descripción breve.
 *
 * @since 1.0.0
 * @param string $param1 Descripción.
 * @param int    $param2 Descripción.
 * @return bool True en éxito.
 */
function my_plugin_function( $param1, $param2 ) { }
```
- [ ] Todas las funciones tienen PHPDoc
- [ ] README.md y CHANGELOG.md actualizados
- [ ] Comentarios inline para lógica compleja

**Rendimiento:**
```php
<?php
// Carga lazy
add_action( 'plugins_loaded', 'my_plugin_init' );

// Cache con transients para operaciones costosas
$data = get_transient( 'my_data_key' );
if ( false === $data ) {
    $data = expensive_function();
    set_transient( 'my_data_key', $data, 12 * HOUR_IN_SECONDS );
}

// Consultas optimizadas
$args = array(
    'posts_per_page' => 10,
    'no_found_rows'  => true,   // Omitir conteo total
    'fields'         => 'ids',  // Solo IDs si no se necesita post completo
);
```
- [ ] Consultas optimizadas con indices, resultados limitados
- [ ] Assets minificados en producción
- [ ] Cache implementado para operaciones costosas
- [ ] Sin consultas en loops (evitar N+1)

**Escalabilidad:**
- [ ] Namespaces o prefijos en todo (evitar conflictos)
- [ ] Hooks personalizados documentados para extensibilidad
- [ ] Filtros en puntos clave para otros plugins
- [ ] Arquitectura modular (clases por responsabilidad)
- [ ] Async para tareas pesadas (WP Cron o Action Scheduler)

---

## PASO 9: Checklist Final Pre-Lanzamiento

**OBLIGATORIO antes de publicar:**
- [ ] WPCS: 0 errores
- [ ] Auditoria de seguridad: 0 vulnerabilidades críticas
- [ ] Pruebas unitarias pasan (si existen)
- [ ] Compatible con WP 6.8+ (probado)
- [ ] Compatible con PHP 8.2+ (probado)
- [ ] Cero funciones deprecadas
- [ ] Assets optimizados (CSS/JS minificados)
- [ ] i18n completo (todos los strings traducibles)
- [ ] README completo y actualizado
- [ ] Screenshot valido (1200x900px para theme)
- [ ] Versión actualizada en headers
- [ ] CHANGELOG actualizado

---

---

## PUERTA PRE-IMPLEMENTACIÓN (OBLIGATORIO)

Antes de iniciar cualquier implementación, TODOS los checkboxes deben estar marcados:

- [ ] Triaje de Ingeniería completado — alcance validado con usuario (ESTÁNDAR+)
- [ ] Prerequisitos verificados — todos existen o tienen tarea separada
- [ ] Complejidad clasificada (SIMPLE / ESTÁNDAR / COMPLEJA / CRÍTICA)
- [ ] Pre-flight completado sin errores (PASO 0.1)
- [ ] Archivos afectados identificados
- [ ] Alternativas evaluadas (ESTÁNDAR+, PASO 0B)
- [ ] Casos extremos analizados (ESTÁNDAR+, PASO 0C)
- [ ] Rollback documentado (COMPLEJA/CRÍTICA, PASO 0D)
- [ ] Checklist de seguridad completado (PASO 3)
- [ ] Criterios de éxito medibles definidos
- [ ] Documento presentado y aprobado por usuario

→ Si CUALQUIER checkbox sin marcar: DETENER. No implementar.

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
- Existe solución más simple (hook nativo, plugin existente) → proponerla
- Radio de impacto sugiere complejidad diferente a la intuida → advertir y re-clasificar
- Se pide crear complejidad innecesaria → proponer simplificación (KISS)

### Flujo de Trabajo

1. **Triaje** — Analizar impacto, prerequisitos, alcance (Paso 0.0.6 — T1/T2/T3)
2. **Alinear** — Presentar alcance al usuario, esperar confirmación (ESTÁNDAR+)
3. **Pre-flight** — Verificar entorno WordPress (versión, theme, plugins)
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
- Actualizar checkbox: `[x]` + timestamp + archivos modificados + resultado de verificación
- Si se descubre que el alcance era incorrecto → DETENER, comunicar, re-planificar
- Esperar "proceder" antes de siguiente fase

Tras todas las fases: cambiar estado a `Pending Review` → ejecutar checklist de revisión → si APROBADO cambiar a `Completado`.

### Aprobación Explícita

**APROBADO**: "ejecuta", "adelante", "aprobado", "proceder", "se ve bien"
**NO APROBADO**: "interesante", "ya veo", preguntas sobre el plan, silencio
**AMBIGUO**: "ok", "vale", "claro" → confirmar antes de proceder
<!-- /SHARED-BLOCK -->

---

## Agent Recomendado

Después de crear el documento de tarea, usar el siguiente agent para implementación:

| Stack | Skill Recomendada |
|-------|-------------------|
| WordPress | `cleanup-php` + `reviewer` |

---

*Versión: 1.0 ES - Plantilla de Desarrollo Moderno WordPress Plugin/Theme*
*Creado: Diciembre 2024*
*Ultima Actualización: 2026-02-13*
*WordPress Objetivo: 6.8+ (2025-2026)*
*PHP Minimo: 8.2+*
*Principios: APIs actuales, seguridad primero, código nativo, cero deuda técnica*
