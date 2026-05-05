# CI Setup

Configuración una sola vez de los secrets necesarios para que los workflows funcionen.

## SSH deploy key para `sync_from_management.yml`

El workflow `sync_from_management.yml` clona el repo privado `AI-Coding-Resources` para sincronizar los templates al wheel público. Para que tenga permisos sin exponer un PAT con scope amplio, se usa una **deploy key SSH read-only** registrada solo en ese repo.

### Pasos (una sola vez)

1. **Generar par de claves nuevo (sin passphrase):**

   ```bash
   ssh-keygen -t ed25519 -C "madkit-sync-bot" -f ~/.ssh/madkit_sync -N ""
   ```

   Esto produce `~/.ssh/madkit_sync` (privada) y `~/.ssh/madkit_sync.pub` (pública).

2. **Registrar la pública como deploy key en `AI-Coding-Resources`:**

   - Settings → Deploy keys → Add deploy key
   - Title: `madkit-sync-bot`
   - Key: pegar contenido de `madkit_sync.pub`
   - **NO marcar "Allow write access"** — read-only es suficiente.

3. **Registrar la privada como secret en `multi-agent-development-kit/madkit`:**

   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `MANAGEMENT_REPO_DEPLOY_KEY`
   - Value: pegar contenido completo de `~/.ssh/madkit_sync` (incluye las líneas `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`)

4. **Disparar el workflow manualmente para verificar:**

   - Actions → sync-from-management → Run workflow
   - Si el secret está configurado correctamente, ejecuta el clone, sync, y abre PR auto-sync si hay diff.
   - Si no hay diff, el workflow imprime "Sin cambios" y termina con éxito.

5. **Limpieza local:**

   ```bash
   shred -u ~/.ssh/madkit_sync ~/.ssh/madkit_sync.pub  # POSIX
   # o:
   Remove-Item ~/.ssh/madkit_sync*                     # PowerShell
   ```

   La privada queda solo en GitHub Secrets.

### Comportamiento sin secret configurado

Si el secret no existe (estado por defecto del repo), el workflow termina con éxito y emite un warning: *"MANAGEMENT_REPO_DEPLOY_KEY no configurado. Skipping sync."* — no genera runs rojos.

### Rotación

Para rotar la key (recomendado anualmente):

1. Genera par nuevo (paso 1).
2. Reemplaza la deploy key en `AI-Coding-Resources` (paso 2).
3. Actualiza el secret en `madkit` (paso 3).
4. Verifica con run manual (paso 4).

## Otras configuraciones

- `tests.yml`: cero secrets requeridos. Funciona out-of-the-box.
- `release.yml`: usa `GITHUB_TOKEN` automático. Cero setup manual.
