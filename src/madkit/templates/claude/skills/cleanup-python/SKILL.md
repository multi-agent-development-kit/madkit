---
name: cleanup-python
description: "Guía Python 3.10+ (FastAPI, Flask, scripts). Activar proactivamente al editar/crear .py, al refactorizar, limpiar u optimizar código Python. SIN manage.py. Con manage.py → cleanup-django. Scope: archivos de la tarea activa."
context: fork
agent: implementer
effort: high
paths: ["**/*.py"]
---

# Limpieza y Codificación Python

> **Propósito:** Guía operativa para proyectos Python con UV + `pyproject.toml`. Cubre code quality, type safety, linting y limpieza de código muerto.

> **Alcance:** Solo proyectos Python con `pyproject.toml` y UV. Si existe `package.json` sin `pyproject.toml`, usar `cleanup`. **Si existe `manage.py` → usar `cleanup-django`.**

---

## Detección de Proyecto

| Indicador | Stack | Acción |
|-----------|-------|--------|
| `manage.py` + `settings.py` | Django | **NO usar esta skill → cleanup-django** |
| `pyproject.toml`, `uv.lock`, archivos `.py` | Python 3.10+ | Esta skill |
| `package.json`, `tsconfig.json` | Node.js/TS | Usar cleanup |

Confirmar: `pyproject.toml` + `uv.lock` + archivos `.py`. Detectar grupos de dependencias en `pyproject.toml` (dev, lint, test).

---

## UV y pyproject.toml

**Nunca uses `pip install`.** Este proyecto usa `uv` como único gestor.

**Grupos de dependencias:**
- `[project.dependencies]` → runtime
- `[dependency-groups.dev]` → desarrollo (formatting, type checking)
- `[dependency-groups.test]` → testing
- `[dependency-groups.lint]` → calidad de código (ruff, black, mypy)

```bash
uv add "package>=1.0.0"              # runtime
uv add --group dev "package"          # desarrollo
uv add --group test "package"         # testing
uv remove "package"                   # eliminar
uv sync --group dev --group test      # instalar todo
```

**Tras editar pyproject.toml manualmente**, siempre ejecuta `uv sync` para sincronizar.

---

## Linting Obligatorio (GATE)

**Ejecuta INMEDIATAMENTE después de crear o editar cualquier archivo Python:**

```bash
uv run --group lint ruff check --fix archivo.py   # 1º: autofix
uv run --group lint black archivo.py               # 2º: formato
uv run --group lint mypy archivo.py                # 3º: tipos
```

**Este orden es obligatorio** — ruff primero (autofix), black después (formato), mypy último (tipos sobre código limpio). Ejecutar desordenado produce falsos positivos.

**La tarea NO está completa hasta que las 3 verificaciones pasen.**

---

## Seguridad de Tipos (Python 3.10+)

### Sintaxis moderna obligatoria

| ❌ Legacy | ✅ Moderno |
|-----------|-----------|
| `typing.Dict[str, int]` | `dict[str, int]` |
| `typing.List[str]` | `list[str]` |
| `typing.Optional[str]` | `str \| None` |
| `typing.Union[str, int]` | `str \| int` |

Solo importa de `typing`: `Protocol`, `TypeVar`, `Generic`, `Literal`, `cast`, `TypedDict`.
Usa `collections.abc` para: `AsyncGenerator`, `Generator`, `Iterator`, `Callable`.

### Regla: Cero `Any`

**NUNCA usar `Any` en código nuevo o modificado** — siempre encontrar e importar los tipos apropiados del framework/biblioteca. Si el tipo correcto no puede determinarse, **detenerse y preguntar**. `Any` preexistente en código no modificado → reportar, no forzar eliminar.

```bash
grep -r ": Any\|-> Any\|Any]" . --include="*.py" --exclude-dir=__pycache__
# Debe retornar vacío
```

### Tipos de Framework: Importar, No Inventar

```python
# ❌ MAL
state: Any

# ✅ BIEN
from google.adk.sessions import State
state: State
```

---

## Scope de Limpieza

- **Solo archivos de la tarea actual.** No expandir limpieza a módulos adyacentes. Issues fuera del scope → documentar como nota, no actuar.
- **Antes de eliminar código "muerto":** Verificar que no se use vía dynamic imports, decoradores, entry points, plugins, CLI commands o side effects. En caso de duda → NO eliminar, preguntar al usuario.
- **`# type: ignore` / `Any` en código no modificado por la tarea** → reportar, no eliminar automáticamente. Pueden ser decisiones intencionales en integraciones externas o código legacy.

## Orden de Prioridad de Limpieza

1. **Errores críticos** — imports rotos, sintaxis inválida, `ruff` errores de categoría E
2. **Código muerto confirmado** — funciones/clases sin ninguna referencia (solo en archivos de la tarea), imports F401
3. **Type safety** — usos de `Any`, `# type: ignore`, anotaciones faltantes
4. **Rendimiento** — queries sin optimizar, loops innecesarios, imports pesados no utilizados
5. **Dependencias** — paquetes en `pyproject.toml` no importados, versiones con vulnerabilidades
6. **Organización** — archivos vacíos, `__init__.py` innecesarios, estructura inconsistente

## Comandos de Análisis

```bash
# Acotar a archivos de la tarea actual (<archivos> = archivos modificados)
uv run ruff check --select F401,F841 --output-format=full <archivos>  # imports/vars no usadas
uv run ruff check --output-format=full <archivos>                      # análisis completo
uv run mypy <archivos>                                                  # verificación de tipos
grep -r "type: ignore" <archivos>                                       # supresiones
uv tree                                                                 # árbol de deps (informativo)
grep -r "print(" <archivos>                                             # prints en prod
```

## Dependencias en `pyproject.toml`

- Verificar que cada paquete en `[project.dependencies]` se importa en algún lugar
- Verificar que herramientas de dev están en el grupo correcto (dev, lint, test)
- UV no tiene `depcheck` — el análisis de dependencias no utilizadas es manual

---

## Boundaries (cero tolerancia)

- **NUNCA** uses `# type: ignore` en código nuevo o modificado — arregla la causa raíz (instalar stubs, usar `cast`, definir tipos). Preexistente en código no tocado → reportar, no forzar eliminar.
- **NUNCA** uses tipo `Any` en código nuevo o modificado — siempre tipos explícitos. Preexistente → reportar.
- **TODAS** las funciones requieren anotación de tipo de retorno (incluido `-> None` en funciones void)
- **SIEMPRE** usa encadenamiento de excepciones: `raise CustomError(...) from e`

## Validación Post-Limpieza

```bash
uv run ruff check            # 0 errores nuevos (preexistentes fuera de scope)
uv run mypy .                # 0 errores nuevos (preexistentes fuera de scope)
uv run pytest                # todos los tests pasan
grep -r ": Any\|-> Any\|Any]" . --include="*.py" --exclude-dir=__pycache__  # vacío
```

> Si los tests fallan tras limpieza, la limpieza introdujo una regresión — revertir y corregir.
