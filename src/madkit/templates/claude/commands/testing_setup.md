# Setup de Infraestructura de Testing

> **Propósito:** Setup one-shot idempotente de infraestructura de testing. Instala framework, coverage, pre-commit hooks y CI/CD.
>
> **Cuándo usar:** Proyecto sin framework de testing, o con setup incompleto. Ejecutar ANTES de escribir tests.
>
> **NO usar para:** Escribir tests (usar skill `unit-testing`), evaluar agentes ADK (usar `adk-evaluation-testing`), setup de ai_docs/ (usar `setup_project`).

---

## Fase 1: Reconocimiento

```
1. Detectar stack (pyproject.toml, package.json, composer.json, manage.py)
2. ¿Framework de testing existente? → respetarlo, no reemplazar
3. ¿Tests existentes? ¿Cuántos? ¿Pasan?
4. ¿Coverage configurado?
5. ¿Pre-commit hooks?
6. ¿CI/CD pipeline?
```

**Idempotente:** si algo ya existe, no tocarlo. Solo completar lo que falta.

### Detección de framework existente

| Archivo | Framework | Acción |
|---------|-----------|--------|
| `vitest.config.*` | Vitest | Respetar, completar config |
| `jest.config.*` | Jest | Respetar, NO migrar a Vitest |
| `pytest.ini` o `[tool.pytest]` en pyproject.toml | pytest | Respetar, completar plugins |
| `phpunit.xml` | PHPUnit | Respetar, sugerir Pest como complemento |
| `Pest.php` | Pest | Respetar, completar config |

**Si no hay framework:** instalar el recomendado para el stack.

---

## Fase 2: Instalación por Stack

### TypeScript/Next.js

```bash
# Framework (si no existe)
npm install -D vitest @vitest/coverage-v8

# Testing Library (si hay React)
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**vitest.config.ts (template):**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      exclude: [
        'node_modules/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types/',
        'tests/',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Scripts en package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Python (pytest)

```bash
uv add --group test pytest pytest-cov pytest-asyncio pytest-mock pytest-xdist factory-boy freezegun
```

**pyproject.toml (añadir):**
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-v --strict-markers --tb=short"
markers = [
    "slow: marks tests as slow",
    "integration: marks integration tests",
]

[tool.coverage.run]
source = ["src"]  # Ajustar al directorio raíz del código fuente
branch = true
omit = [
    "*/migrations/*",
    "*/__init__.py",
    "*/conftest.py",
]

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ ==",
]
```

### Django (pytest-django)

```bash
uv add --group test pytest-django factory-boy pytest-cov pytest-xdist
```

**pyproject.toml (añadir):**
```toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.test"
testpaths = ["tests"]
addopts = "-v --strict-markers --tb=short --reuse-db"
markers = [
    "slow: marks tests as slow",
    "integration: marks integration tests",
]

[tool.coverage.run]
# Ajustar a las apps Django del proyecto
source = ["apps"]
branch = true
omit = ["*/migrations/*", "*/admin.py", "*/conftest.py"]
```

**config/settings/test.py (template):**
```python
from .base import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
}
```

### PHP/Laravel (Pest)

```bash
composer require pestphp/pest --dev --with-all-dependencies
composer require pestphp/pest-plugin-laravel --dev
php artisan pest:install
```

**phpunit.xml (verificar coverage):**
```xml
<coverage>
    <include>
        <directory suffix=".php">./app</directory>
    </include>
    <exclude>
        <directory suffix=".php">./app/Providers</directory>
    </exclude>
</coverage>
```

---

## Fase 3: Pre-commit Hooks

**Adopción progresiva (niveles definidos en skill `unit-testing` S2):**
- **L0-L1:** instalar framework pero solo lint, NO tests
- **L2:** añadir tests afectados al hook
- **L3:** enforcement completo

### TypeScript (husky + lint-staged)
```bash
npm install -D husky lint-staged
npx husky init
```

**.husky/pre-commit:**
```bash
npx lint-staged
```

**package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### Python (pre-commit)
```bash
uv add --group dev pre-commit
```

**.pre-commit-config.yaml:**
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

### PHP (captainhook)
```bash
composer require --dev captainhook/captainhook
vendor/bin/captainhook install
```

---

## Fase 4: CI/CD Pipeline (GitHub Actions)

### Template progresivo

**L1 — Lint + tests (sin threshold):**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # [setup steps por stack]
      - run: [lint command]
      - run: [test command]
```

**L2 — + coverage report como comment en PR:**
```yaml
      - run: [test + coverage command]
      - uses: orgoro/coverage@v3
        with:
          coverageFile: coverage.xml
          token: ${{ secrets.GITHUB_TOKEN }}
```

**L3 — + threshold bloqueante:**
```yaml
      - run: [test + coverage --fail-under=80]
```

---

## Fase 5: Validación

```
1. Framework de testing instalado y ejecuta (aunque no haya tests)
2. Coverage configurado y reporta baseline
3. Pre-commit hooks instalados (si nivel ≥ L2)
4. CI pipeline configurado (si repositorio tiene remote)
```

### Output final

```
Setup de Testing Completo

**Stack:** [Framework X.Y]
**Framework de testing:** [nombre + versión]
**Nivel de madurez detectado:** [L0/L1/L2/L3]

Instalado:
- [x] Framework de testing: [nombre]
- [x] Coverage: [herramienta] (baseline: X%)
- [ ] Pre-commit hooks (sugerido para L2+)
- [ ] CI/CD pipeline (sugerido cuando hay remote)

Próximos pasos:
1. Escribir primeros tests con skill `unit-testing`
2. Ejecutar [test command] para verificar
3. Ejecutar [coverage command] para baseline

Baseline actual: X tests | Y% coverage
```

---

*Versión: 1.0.0 | Creación: 2026-03-18*
