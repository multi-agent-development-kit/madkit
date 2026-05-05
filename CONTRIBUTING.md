# Cómo contribuir a madkit

Gracias por considerar contribuir. Este proyecto está en alpha — feedback y PRs son muy bienvenidos.

## Setup local

```bash
git clone https://github.com/multi-agent-development-kit/madkit.git
cd madkit
uv venv
uv pip install -e ".[dev]"
pytest
```

## Tipos de contribución

| Tipo | Cómo proponer |
|---|---|
| Bug en el CLI | Issue con label `bug` |
| Solicitar nuevo adapter de IDE (Cline, Continue, Windsurf, etc.) | Issue con label `area:adapter-*` |
| Reportar template que falla en V1-V8 | Issue con label `area:templates` |
| Mejora de documentación | PR directo con label `area:docs` |

## Convenciones

- **Idioma del código y comentarios:** inglés. **Idioma de docs y mensajes al usuario:** español por defecto, inglés disponible.
- **Tipo hints obligatorios** en todo código nuevo (`from __future__ import annotations`).
- **Tests obligatorios** para todo módulo nuevo. Cobertura mínima del paquete: 60%.
- **Commits:** formato `<tipo>: <subject>` con tipos `create | optimize | update | fix | refactor`.

## Code of conduct

Contributor Covenant v2.1. Cero tolerancia a comportamiento abusivo. Reporta a través de Issues con label `code-of-conduct`.
