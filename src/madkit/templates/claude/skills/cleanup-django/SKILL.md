---
name: cleanup-django
description: "Guía Django/DRF. Activar proactivamente EN LUGAR DE cleanup-python cuando exista manage.py o django en deps. Al refactorizar, limpiar u optimizar código Django. Modelos, vistas, serializers, migraciones, ORM. Scope: archivos de la tarea activa."
context: fork
agent: implementer
effort: high
paths: ["**/*.py", "**/manage.py", "**/settings.py", "**/urls.py", "**/admin.py", "**/apps.py", "**/tasks.py"]
---

# Limpieza y Codificación Django

> **Propósito:** Guía operativa para proyectos Django — code quality, ORM optimization, migraciones seguras, arquitectura y limpieza de código muerto.

> **Alcance:** Solo proyectos Django. Para Python genérico (FastAPI, Flask), usar `cleanup-python`.

---

## Detección de Proyecto

| Indicador | Stack | Acción |
|-----------|-------|--------|
| `manage.py` + `settings.py` | Django | Esta skill |
| `rest_framework` en INSTALLED_APPS | Django + DRF | Esta skill + patrones DRF |
| `pyproject.toml` sin `manage.py` | Python genérico | Usar cleanup-python |

Confirmar: `manage.py` + settings con `INSTALLED_APPS` + apps Django. Detectar: versión Django, DRF, Celery, backend de caché, estructura de settings.

---

## UV y pyproject.toml

Nunca uses `pip install`. Este proyecto usa `uv`.

**Grupos de dependencias:**
- `[project.dependencies]` → Django, DRF, drivers de BD
- `[dependency-groups.dev]` → django-extensions, debug-toolbar
- `[dependency-groups.test]` → pytest-django, factory-boy
- `[dependency-groups.lint]` → ruff, mypy, django-stubs

```bash
uv add "django>=4.2"
uv add --group dev "django-extensions"
uv add --group test "pytest-django" "factory-boy"
uv sync --group dev --group test
```

**Tras editar pyproject.toml manualmente**, siempre ejecuta `uv sync`.

---

## Linting Obligatorio (GATE)

**Ejecuta INMEDIATAMENTE después de crear o editar cualquier archivo Python/Django:**

```bash
uv run --group lint ruff check --fix .
uv run --group lint black .
uv run --group lint mypy .
python manage.py check
python manage.py makemigrations --check --dry-run
```

**La tarea NO está completa hasta que todas las verificaciones pasen.**

---

## Code Smells Django

| Code Smell | Síntoma | Corrección |
|------------|---------|------------|
| **Fat Views** | Lógica de negocio en views | Mover a models/services |
| **N+1 Queries** | Loop con query dentro | `select_related`/`prefetch_related` |
| **God Model** | Modelo con >20 campos y >300 líneas | Dividir en modelos relacionados |
| **Magic Strings** | `if status == 'active'` hardcodeado | Usar `TextChoices`/constantes |
| **Duplicate Querysets** | Misma query en múltiples views | Custom Manager |
| **Signal Abuse** | Signals para todo | Solo side-effects cross-app |

---

## Optimización de Queries ORM

**Siempre** usa `select_related()` para ForeignKey y `prefetch_related()` para ManyToMany/reverse FK:

```python
# ❌ N+1: 1 query posts + N queries authors
posts = Post.objects.all()
for post in posts:
    print(post.author.name)

# ✅ 1 query con JOIN
posts = Post.objects.select_related('author').all()

# ✅ M2M optimizado
posts = Post.objects.prefetch_related('tags', 'comments__author').all()
```

**Optimizaciones adicionales:**
- `only('id', 'title')` / `defer('content')` para campos específicos
- `exists()` en vez de `count() > 0` para verificaciones booleanas
- `values()` / `values_list()` cuando no necesitas instancias de modelo

## Custom Model Managers

```python
class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(
            published_at__isnull=False,
            published_at__lte=timezone.now()
        )

class Article(models.Model):
    objects = models.Manager()
    published = PublishedManager()
```

---

## Scope de Limpieza

- **Solo archivos de la tarea actual.** No expandir limpieza a módulos adyacentes. Issues fuera del scope → documentar como nota, no actuar.
- **Antes de eliminar código "muerto":** Verificar que no se use vía signals, admin, template tags, URLs, management commands, middleware o fixtures. En caso de duda → NO eliminar, preguntar al usuario.
- **`# type: ignore` / `Any` en código no modificado por la tarea** → reportar, no eliminar automáticamente.

## Reglas Críticas

- **NUNCA auto-aplicar migraciones** — solo analizar, nunca modificar estado de BD
- **SIEMPRE verificar dependencias antes de sugerir eliminación** — código "sin uso" podría estar utilizado via señales, admin, template tags o URLs

## Orden de Prioridad de Limpieza

1. **Errores críticos** — `manage.py check` errores, migraciones inconsistentes, imports rotos
2. **Código muerto confirmado** — apps sin uso en INSTALLED_APPS, serializers/views sin referencia
3. **Type safety** — usos de `Any`, `# type: ignore`, anotaciones faltantes (si usa django-stubs)
4. **Rendimiento** — N+1 queries, índices faltantes, querysets sin optimizar
5. **Seguridad** — `|safe` sin justificar, `@csrf_exempt`, `.raw()` sin parametrizar, secretos expuestos
6. **Deuda de migraciones** — candidatas a squash (>15 por app), RunPython sin reversa
7. **Dependencias** — apps/paquetes no utilizados, versiones con vulnerabilidades

## Detección de Código Muerto Django

### INSTALLED_APPS
Verificar cada app: ¿se importa? ¿tiene middleware activo? ¿tiene URLs incluidas? ¿tiene template tags usados?

### DRF (si instalado)

Para serializers/viewsets en archivos modificados por la tarea actual, verificar que tienen referencia en urls.py o router:

```bash
# Verificar serializers en archivos modificados (no auditoría global)
grep -rn "NombreSerializer" --include="*.py" --exclude-dir=migrations  # ¿tiene referencias?

# Verificar viewsets en archivos modificados
grep -rn "NombreViewSet" --include="urls.py"  # ¿está mapeado?
```

> Para auditoría global de código muerto DRF → crear tarea dedicada de cleanup.

---

## Migraciones: Seguridad

- **Siempre reversibles:** `RunPython(forward, reverse)` — nunca sin operación reversa
- **Backward-compatible:** Agregar columnas como nullable o con defaults
- **Multi-fase para breaking changes:**
  1. Agregar nueva columna (nullable)
  2. Poblar datos + actualizar código
  3. Hacer NOT NULL + eliminar columna vieja

## Salud de Migraciones

```bash
python manage.py showmigrations --plan | grep "\[ \]" | wc -l   # pendientes
grep -rn "RunPython" */migrations/*.py 2>/dev/null | head -10    # sin reversa
```

## Índices Faltantes

Campos usados en `filter()`, `order_by()`, `exclude()`, `list_filter`, `search_fields` que no tienen `db_index=True` ni están en `Meta.indexes`.

---

## Arquitectura Django

- **Lógica de negocio** en models o services, **NUNCA** en views
- **Views:** solo orquestación (validar → procesar → responder)
- **DRF:** ViewSets para CRUD estándar, APIView para lógica custom
- **DRF errores:** usar `ValidationError`, `NotFound`, `PermissionDenied` — no excepciones genéricas
- **Signals:** solo para side-effects cross-app (ej: crear UserProfile al crear User)
- **Settings:** archivos separados base/development/production con `os.getenv()` para secretos

## OWASP en Django

| Riesgo | Patrón Peligroso | Detección |
|---|---|---|
| Inyección SQL | `.raw()`, `.extra()`, `cursor.execute()` | Grep para SQL crudo sin parametrización |
| XSS | `\|safe`, `mark_safe()` en input de usuario | Grep en `.py` y `.html` |
| CSRF | `@csrf_exempt` | Grep para exenciones |
| Exposición de datos | Secretos hardcodeados en settings | `SECRET_KEY = '...'` en código |
| Control de acceso | Vistas DRF sin `permission_classes` | Revisar vistas |

---

## Boundaries (cero tolerancia)

- **NUNCA** uses `# type: ignore` en código nuevo o modificado — instala django-stubs, usa `cast`. Preexistente en código no tocado → reportar, no forzar eliminar.
- **NUNCA** uses tipo `Any` en código nuevo o modificado. Preexistente → reportar.
- **TODAS** las funciones requieren anotación de tipo de retorno
- **SIEMPRE** usa `raise ... from e` para encadenamiento de excepciones
- **SIEMPRE** usa `{% csrf_token %}` en formularios y queries parametrizadas (nunca f-strings en SQL)
- **NUNCA** uses `|safe` en templates sin verificar que el contenido está sanitizado — cada uso de `mark_safe()` requiere justificación explícita
- **SIEMPRE** usa `FileExtensionValidator` + validación de content-type en uploads

## Validación Post-Limpieza

```bash
python manage.py check                          # 0 problemas
python manage.py check --deploy                  # 0 problemas
python manage.py makemigrations --check --dry-run  # sin migraciones faltantes
uv run pytest -v                                 # todos pasan (o python manage.py test)
uv run ruff check .                              # 0 errores nuevos (preexistentes fuera de scope)
uv run mypy .                                    # 0 errores nuevos (preexistentes fuera de scope, si usa django-stubs)
```

> Si los tests fallan tras limpieza, la limpieza introdujo una regresión — revertir y corregir.
