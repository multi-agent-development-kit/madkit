# Sincronizar Templates — Post-sync inmediato

> Limpia el estado post-sync y activa los nuevos hooks.
> Prerequisito: `./sync_templates.{sh,ps1}` ya ejecutó y el reporte llega embebido en el prompt.
> La calibración, onboarding y auditoría documental se lanzan en sesiones independientes a continuación.

---

## Paso 1: Estado del repositorio

```bash
git fetch origin 2>/dev/null || true
git status --short
```

Mostrar en una línea. Nunca bloquear por cambios sin commitear.

---

## Paso 2: Leer reporte

Usar el reporte embebido en el prompt. Si no viene embebido, leer `.claude/.sync_report.txt`.

Clasificar:

| Condición | Nota para el resumen final |
|-----------|---------------------------|
| ≥1 archivo modificado | "Calibración pendiente — el script la lanza automáticamente a continuación" |
| 0 cambios | "Templates al día — calibración no necesaria" |

---

## Paso 2.5: Eliminar archivos [LOCAL] deprecados

Si no hay líneas `[LOCAL]` en el reporte: skip silencioso.

Si hay entradas `[LOCAL]`: eliminar sin preguntar.

```bash
rm -f "<archivo-local>"
```

Registrar como `[ELIMINADO]` en el resumen final.

---

## Paso 4.6: Activar hooks nuevos en config.json

**Condición:** `.claude/hooks/config.json` Y `.claude/hooks/config.example.json` existen.
**Si no existen ambos:** skip silencioso.

1. Comparar claves de `config.example.json` (upstream) contra `config.json` (proyecto).
2. Añadir claves nuevas con valor conservador:
   - Boolean → `true`
   - Con `mode:` → `{enabled: true, mode: "advisory"}`
3. Claves removidas en upstream: NO eliminar. Emitir `[HOOK-LEGACY]`.
4. Claves con schema distinto: NO sobrescribir. Emitir `[HOOK-DRIFT]`.

---

## Paso 4.5: Verificar bidireccionalidad sprint-sync

**Condiciones (TODAS):** `sprint_sync.mode` en `config.json` AND hay sprints abiertos en `ai_docs/sprints/`.
**Si no se cumplen:** skip silencioso.

Verificar que los templates modificados en el sync no solapan con `contract.files_touched` de tasks activas. Solo informar — no bloquear.

---

## Paso 5: Limpiar y reportar

```bash
rm -f .claude/.sync_report.txt
```

Resumen compacto:
- Archivos actualizados por el sync (lista breve)
- Archivos [LOCAL] eliminados (si aplica)
- Hooks activados en config.json (si aplica)
- Estado: "calibración pendiente" o "templates al día"
