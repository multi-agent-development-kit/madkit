# Sincronizar Templates desde Upstream

> Wrapper de `madkit sincronizar` (CLI `madkit` del repo público `multi-agent-development-kit`). Pull templates upstream + diff + report + calibración opcional.

---

## Paso 1: Verificar repo limpio

```bash
git status
```

- Si hay cambios sin commit: **DETENER**, esperar decisión del usuario (commit, stash, o continuar igualmente).
- Si todo limpio: proceder.

**PUNTO DE ESPERA:** No continuar hasta que el estado del repo sea limpio o el usuario confirme.

---

## Paso 2: Ejecutar `madkit sincronizar`

Detectar instalación de `madkit`:

- Si `madkit` está en PATH: ejecutar `madkit sincronizar`.
- Si NO está instalado, sugerir al usuario:
  - **Sin instalar:** `uvx --from git+https://github.com/multi-agent-development-kit/madkit@v0.1.0 madkit sincronizar`
  - **Instalación recurrente:** `uv tool install git+https://github.com/multi-agent-development-kit/madkit@v0.1.0` y luego `madkit sincronizar`

### Manejo de exit codes del CLI

| Exit code | Significado | Acción |
|---|---|---|
| `0` | OK (con o sin cambios) | Continuar a Paso 3 |
| `1` | Error de entorno (filesystem, permisos, red ausente con `--check-update`) | Mostrar error y terminar |
| `2` | **V1-V6 ABORT** — regresión upstream (`model:` en skill, fork huérfano, frontmatter malformado, `name:` != folder, `model:` de agent inválido) | Mostrar errores y NO continuar — el upstream debe corregirse antes de reintentar |
| `3` | V7-V8 WARN — cambios aplicados con avisos | Continuar a Paso 3 mostrando los warnings |

NO usar flags para saltarse la validación cuando exit code = 2.

---

## Paso 3: Leer reporte de cambios

Leer el reporte generado por el CLI:

```
.claude/.sync_report.txt
```

| Tipo de cambio | Acción |
|---|---|
| Solo skills/agents modificados | Informar, NO requiere calibración completa |
| Commands modificados o nuevos archivos | Requiere `/calibrate_templates` |
| Sin cambios | Informar y terminar |

---

## Paso 4: Calibrar si es necesario

Si hay cambios que requieren calibración:

1. Informar al usuario qué cambió y por qué se recomienda calibrar.
2. **PUNTO DE ESPERA:** Preguntar `¿Ejecuto /calibrate_templates ahora?`.
3. Si aprueba: ejecutar `/calibrate_templates` **sin argumentos** — el comando auto-detecta:
   - **INCREMENTAL** si existe `.claude/.sync_report.txt`, hay calibración previa <30 días, y <50 commits desde el HEAD registrado.
   - **FULL-PASS** si no se cumplen las condiciones (calibración inicial, sync_report ausente, contexto obsoleto).
4. Si rechaza: terminar — los templates nuevos funcionarán con la configuración genérica.

**Override del modo:**
- `/calibrate_templates --full` para forzar full-pass.
- `/calibrate_templates --changed-only` para forzar incremental (requiere `.sync_report.txt`).

---

## Paso 5: Limpiar

```bash
rm -f .claude/.sync_report.txt                                      # POSIX
Remove-Item .claude/.sync_report.txt -ErrorAction SilentlyContinue  # PowerShell
```

Informar al usuario:
- Qué se actualizó (resumen breve).
- Si se calibró o no.
- Sugerir commitear los cambios si todo está bien.

---

> **Migración:** este slash es un wrapper del CLI `madkit` (paquete Python instalable, repo público `multi-agent-development-kit`). El bootstrap mecánico inicial de un proyecto nuevo (estructura `ai_docs/`, scaffolding del IDE) lo hace `madkit iniciar`. Los scripts shell legacy `scripts/sync_templates.{ps1,sh}` siguen disponibles como fallback durante 2 versiones del CLI estables.
