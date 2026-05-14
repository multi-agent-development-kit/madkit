---
name: worktree-management
description: "Gestión de git worktrees. Activar para tareas COMPLEJA/CRÍTICA, desarrollo paralelo, aislar experimentos, o trabajar en otra rama sin perder cambios. Skill auxiliar de git-guardian, funciona independientemente."
argument-hint: "[nombre | list | remove nombre]"
effort: low
---

# Git Worktree Manager

> Crear, gestionar y limpiar git worktrees para desarrollo paralelo.

---

## Modos de Comando

| Input | Modo | Accion |
|-------|------|--------|
| `{name}` | **CREATE** | Crear nuevo worktree como directorio hermano |
| `list` | **LIST** | Mostrar todos los worktrees activos |
| `remove {name}` | **REMOVE** | Eliminar worktree y opcionalmente eliminar branch |

## Resolucion de Rutas

```bash
WORKTREE_DIR="$(dirname $(pwd))/$(basename $(pwd))-{name}"
```

Ejemplo: `/worktree auth` en `/code/myapp` → `/code/myapp-auth/`, branch: `feat/auth`

## Nomenclatura de Branch

| El nombre contiene | Prefijo | Ejemplo |
|--------------------|---------|---------|
| `fix`, `bug`, `hotfix` | `fix/` | `fix/agent-bug` |
| cualquier otra cosa | `feat/` | `feat/new-agent` |

---

## Paso 0: Health-check de viabilidad

Antes de crear el worktree, verificar señales de proyecto git restrictivo. Si se detecta ≥1 señal y NO se pasó flag `--force`, **degradar a branch normal en cwd actual** con warning estructurado.

### Las 7 señales restrictivas

```bash
# Detección barata, deterministic, todas exit 0/1.
[ "$(git config --get core.sparseCheckout 2>/dev/null)" = "true" ]              && echo "sparse-checkout"
[ -n "$(git config --get extensions.partialClone 2>/dev/null)" ]                 && echo "partial-clone"
[ -f .gitmodules ]                                                                && echo "submodules"
grep -q 'filter=lfs' .gitattributes 2>/dev/null                                   && echo "git-lfs"
[ "$(git config --get commit.gpgsign 2>/dev/null)" = "true" ]                    && echo "gpg-signing"
[ -d .husky ] && [ "$(du -sb .husky 2>/dev/null | cut -f1)" -gt 5000 ]           && echo "husky-heavy"
[ -f .git/hooks/pre-commit ] && [ "$(wc -c < .git/hooks/pre-commit)" -gt 1024 ]   && echo "pre-commit-heavy"
```

### Comportamiento por escenario

| Señales detectadas | Flag `--force` | Acción |
|---|---|---|
| 0 | (ignorado) | Continuar al actual `## CREATE` (worktree). |
| ≥1 | NO | **Degradar a branch normal:** ejecutar `git checkout -b feat/{name}` o `fix/{name}` en cwd actual; emitir warning. NO crear worktree. NO copiar `.env*`. NO `npm install` extra. |
| ≥1 | SÍ | Continuar con worktree pero emitir warning informativo del riesgo. Usuario asume consecuencias. |

### Output del warning (degradación a branch)

Emitir: señales detectadas + riesgo por señal (`sparse-checkout` → worktree add puede fallar; `submodules` → no se inicializan; `git-lfs` → smudge filter duplicado; `gpg-signing`/`husky-heavy` → hooks corren dos veces) + acción tomada (branch normal `feat|fix/{name}`) + instrucción de override (`--force`).

### Casos límite

- Repo sin git inicializado: `git config` falla → emitir error claro "no es un git repo" y exit. NO degradar silenciosamente.
- `.gitattributes` ausente: grep retorna exit 1 → considerar señal `git-lfs = false` (no falso positivo).
- Repo sin `.git/hooks/pre-commit`: condición false, no se cuenta como señal.

---

## CREATE

> **Pre-requisito:** Paso 0 health-check pasó con 0 señales o flag `--force` aplicado.

1. Validar que estamos en repo git, `git fetch origin`
2. Verificar conflictos: branch existente, directorio existente
3. Crear worktree: `git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}" origin/main`
4. **Copiar archivos `.env*`** del proyecto principal (raiz + apps en monorepos)
5. Instalar dependencias (`npm install` / `uv sync`)

Reportar: `Location: {WORKTREE_DIR} | Branch: {BRANCH_NAME}` + comandos de inicio (`cd {WORKTREE_DIR}`, `PORT=3001 npm run dev`, `claude --cwd {WORKTREE_DIR}`) + recordatorio de cierre (`/worktree remove {name}`).

## LIST

```bash
git worktree list
```

## REMOVE

1. Verificar cambios sin commitear — advertir si existen
2. `git worktree remove "${WORKTREE_DIR}"`
3. Preguntar: eliminar branch (`git branch -d`), forzar (`-D`), o mantener

---

## Consideraciones

- **Puertos:** Usar puertos diferentes por worktree (3000, 3001, 3002...)
- **Base de datos:** Worktrees comparten la misma BD por defecto — coordinar migrations
- **Monorepos:** Copiar `.env*` desde cada `apps/*/` ademas de raiz
- **Claude Code:** Cada worktree puede ejecutar su propia instancia via `claude --cwd`

