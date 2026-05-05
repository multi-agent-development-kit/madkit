---
name: django-migration-workflow
description: "Seguridad en migraciones Django. Activar proactivamente al modificar modelos Django que generarán migraciones, al crear/editar archivos de migración, o al hacer cambios de schema en proyectos con datos existentes."
---

# Migraciones Django Seguras

> Guia de seguridad para migraciones Django en proyectos brownfield con datos existentes.

---

## Reglas de Seguridad para Migraciones de Datos

1. **SIEMPRE proporcionar `reverse_func`** — nunca usar `migrations.RunPython.noop` en produccion
2. **SIEMPRE usar `apps.get_model()`** — nunca importar modelos directamente
3. **Usar `.iterator()`** para querysets grandes
4. **Usar `update_fields`** en `.save()` para evitar senales innecesarias
5. **Procesar en lotes** de 1000-5000 filas para tablas grandes

### Ejemplo: Migracion de Datos Correcta

```python
def forward_func(apps, schema_editor):
    Article = apps.get_model('blog', 'Article')
    for article in Article.objects.filter(slug='').iterator():
        article.slug = slugify(article.title)
        article.save(update_fields=['slug'])

def reverse_func(apps, schema_editor):
    Article = apps.get_model('blog', 'Article')
    Article.objects.update(slug='')

class Migration(migrations.Migration):
    dependencies = [('blog', '0002_add_slug_field')]
    operations = [
        migrations.RunPython(forward_func, reverse_func, elidable=False),
    ]
```

### Lotes para Tablas Grandes

```python
def forward_func(apps, schema_editor):
    Article = apps.get_model('blog', 'Article')
    batch_size = 1000
    total = Article.objects.filter(slug='').count()
    for i in range(0, total, batch_size):
        batch = list(Article.objects.filter(slug='')[i:i + batch_size])
        for article in batch:
            article.slug = slugify(article.title)
        Article.objects.bulk_update(batch, ['slug'], batch_size=batch_size)
```

---

## Estrategia Sin Tiempo de Inactividad (4 fases)

Para agregar un campo requerido a una tabla grande:

```
Migracion 1: AddField(null=True, blank=True)         -- desplegar codigo que escribe al nuevo campo
Migracion 2: RunPython(backfill_func, reverse_func)   -- procesar en lotes
Migracion 3: AlterField(null=False, default=...)       -- o AddConstraint CHECK
Migracion 4: AddIndex (PostgreSQL: CREATE INDEX CONCURRENTLY)
```

### Indice Concurrente en PostgreSQL

```python
from django.contrib.postgres.operations import AddIndexConcurrently

class Migration(migrations.Migration):
    atomic = False  # REQUERIDO para operaciones concurrentes

    operations = [
        AddIndexConcurrently(
            model_name='article',
            index=models.Index(fields=['slug'], name='blog_article_slug_idx'),
        ),
    ]
```

---

## Squash de Migraciones

**Cuando:** app tiene >15 migraciones, TODAS aplicadas en todos los entornos.

**Reglas de seguridad:**
1. **NUNCA hacer squash de migraciones no aplicadas**
2. **Mantener operaciones RunPython** — no marcar como `elidable=True`
3. Eliminar migraciones antiguas SOLO despues de que TODOS los entornos tengan la comprimida aplicada
4. Al finalizar: eliminar lista `replaces` de la migracion comprimida

---

## Errores Comunes

| Error | Sintoma | Prevencion |
|-------|---------|------------|
| Reverse func faltante | `migrate` falla hacia atras | Siempre proporcionar `reverse_func` |
| Import directo de modelo | `ImportError` tras cambios de modelo | Usar `apps.get_model()` |
| Tabla grande sin lotes | OOM, timeouts | Usar `.iterator()` y lotes |
| Indice concurrente con atomic | Migracion se cuelga | `atomic = False` para concurrentes |
| N+1 tras cambio de modelo | API lenta | Probar con `assertNumQueries` |

---

## Migraciones Irreversibles

```python
def reverse_func(apps, schema_editor):
    raise migrations.exceptions.IrreversibleError(
        "No se puede revertir. Restaurar desde backup si es necesario."
    )
```

**Mejor practica:** Respaldar datos originales en tabla/campo temporal antes de transformaciones con perdida.

---

## Verificacion Pre-Migracion

```bash
python manage.py makemigrations --check --dry-run   # 0=sin cambios, 1=desajuste modelo/migracion
python manage.py showmigrations --plan               # [ ]=pendiente, [X]=aplicada
python manage.py sqlmigrate app_name XXXX            # revisar SQL generado
python manage.py sqlmigrate app_name XXXX --backwards # revisar SQL reverso
```
