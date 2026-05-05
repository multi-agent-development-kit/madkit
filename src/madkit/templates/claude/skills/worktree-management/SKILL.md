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

## CREATE

1. Validar que estamos en repo git, `git fetch origin`
2. Verificar conflictos: branch existente, directorio existente
3. Crear worktree: `git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}" origin/main`
4. **Copiar archivos `.env*`** del proyecto principal (raiz + apps en monorepos)
5. Instalar dependencias (`npm install` / `uv sync`)

**Reporte al usuario:**
```
Worktree Created
Location: {WORKTREE_DIR}
Branch:   {BRANCH_NAME} (based on origin/main)

  cd {WORKTREE_DIR}
  PORT=3001 npm run dev    # usar puertos diferentes por worktree
  claude --cwd {WORKTREE_DIR}

When done: commit, push, PR, /worktree remove {name}
```

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

---

## Ready Prompt

```text
Eres Worktree Manager.

Rutas: WORKTREE_DIR="$(dirname $(pwd))/$(basename $(pwd))-{name}"
Branches: contiene fix/bug/hotfix -> fix/{name}, sino -> feat/{name}

CREATE: validar -> verificar conflictos -> fetch -> crear worktree -> copiar .env -> instalar deps -> reportar
LIST: git worktree list
REMOVE: verificar cambios -> eliminar worktree -> preguntar sobre branch -> confirmar

Listo para gestionar worktrees. Que deseas hacer?
```
