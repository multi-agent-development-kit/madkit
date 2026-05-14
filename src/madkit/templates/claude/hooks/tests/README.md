# Tests unitarios de los hooks deployables

Red de seguridad mecánica para los hooks de `claude-templates/hooks/`. Sin
dependencias externas — solo `node:test` y `node:assert` nativos (Node ≥20).

## Cómo correr

```bash
cd claude-templates/hooks/tests
npm test
```

El test runner es `node --test` con reporter `spec`.

## Cobertura por hook

| Hook | Test file | Cubre |
|---|---|---|
| `task-doc-validator.js` | `task-doc-validator.test.js` | Filename inválido bloquea, Criterios de Éxito ausente bloquea, `Depende de:` referencia inexistente bloquea, h3 detectado, flag false silencioso, Edit replace_all válido, Failure Mode Coverage (SIMPLE advisory, ESTÁNDAR sin sección BLOCKER, <3 entradas BLOCKER, sección completa exit 0), Engineering Hygiene Criteria (4 criterios canónicos + variantes + excepción + tarea documental), Sprint Suffix Coherence (filename con sufijo + cabecera matching, mismatch BLOCKER, sufijo huérfano BLOCKER, filename sin sufijo + cabecera WARN, tarea atómica exit 0) |
| `context-monitor.js` | `context-monitor.test.js` | Sin config silencioso, flag false silencioso, 50% sin inyección, 8% escribe STATE.md + BREADCRUMB |
| `prompt-guard.js` | `prompt-guard.test.js` | Limpio pasa, advisory emite WARNING, block emite exit 2, Read path con patrón emite WARNING, Read >100KB con patrón inicial detecta, Read >100KB con patrón final NO detecta |
| `read-injection-scanner.js` | `read-injection-scanner.test.js` | Contenido limpio, 1 patrón LOW, 3+ patrones HIGH |
| `scaffolding-guard.{sh,ps1}` | `scaffolding-guard.test.js` | src/ pasa, ai_docs/ bloquea, tipo no canónico bloquea, subject >72 chars bloquea, Co-Authored-By: Claude bloquea, Co-Authored-By: anthropic bloquea, Co-Authored-By humano legítimo pasa |
| `session-state.{sh,ps1}` | `session-state.test.js` | Flag false silencioso, sin STATE.md emite "sesión limpia", con STATE.md inyecta active_task |
| `sprint-sync.js` | `sprint-sync.test.js` | Sin Sprint declarado silencioso, Sprint válido bidireccional silencioso, Sprint inválido WARN advisory, mode block emite WARN, flag false silencioso, block mode con Sprint inexistente exit 2 + schema canónico, overlap `files_touched` (sin overlap, overlap exacto WARN, overlap parcial WARN, contract sin files_touched silencioso, sprint sin tabla silencioso, wave distinta silencioso, files_touched vacío silencioso) |
| `sprint-doc-validator.js` | `sprint-doc-validator.test.js` | Sprint válido exit 0, Estado duplicado BLOCKER advisory, Estado ausente BLOCKER, Estado inválido WARN, Tabla §3 ausente BLOCKER, Tabla vacía BLOCKER, DAG Mermaid ausente BLOCKER, Lifecycle ausente WARN, task count cabecera vs filas WARN, mode block exit 2, flag ausente silencioso, archivo fuera sprints/ skip, README.md skip |
| `core-context-loader.{sh,ps1}` | `core-context-loader.test.js` | Flag ausente silencioso, core/ ausente silencioso, esenciales cargados + extras como pointer index, sin esenciales emite solo pointer index, byte cap aplicado |
| `resolve_ai_docs` (helper inline) | `resolve_ai_docs.test.js` | Archivo ausente fallback cwd, ruta absoluta válida, ruta no existe en disco fallback, ruta relativa fallback, comentarios `#` ignorados, BOM UTF-8 tolerado, líneas vacías ignoradas, trailing slash normalizado, paths con espacios, encoding UTF-8 sin BOM, encoding UTF-16 LE BOM tolerado, multilinea solo primera no-vacía, ruta cyrillic/Unicode, line endings CRLF/LF, ruta con `~` no expandida fallback, archivo vacío fallback |

## Cómo invocar desde CI

Una sola línea cubre todo:

```bash
cd claude-templates/hooks/tests && npm test
```

Exit 0 si todo pasa, exit 1 si algún test falla. No requiere `npm install`
porque no hay dependencias externas.

Ejemplo workflow GitHub Actions:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: cd claude-templates/hooks/tests && npm test
```

En Windows runners `pwsh` (PowerShell 7+) viene preinstalado; en otros sistemas
no se necesita PowerShell — los tests detectan la plataforma vía
`process.platform` y eligen `bash` o `pwsh`.

## Estructura

```
tests/
├── helper.js                            # invokeJsHook, invokeShellHook, makeTmpProject
├── fixtures/
│   ├── valid-task-doc.md                # task doc bien formado
│   ├── missing-criteria.md              # sin sección "Criterios de Éxito"
│   └── parallelizable-phases-overlap.md # referencia manual D9 (semántica LLM, no automatizada)
├── task-doc-validator.test.js
├── context-monitor.test.js
├── prompt-guard.test.js
├── read-injection-scanner.test.js
├── scaffolding-guard.test.js
├── session-state.test.js
├── sprint-sync.test.js
├── sprint-doc-validator.test.js
├── core-context-loader.test.js
├── resolve_ai_docs.test.js
├── package.json
└── README.md
```

## Limitaciones conocidas

- **scaffolding-guard requiere `git`.** Los tests inicializan un repo en cada
  fixture (`git init`, commit inicial, identidad local). Si `git` no está en
  PATH, los tests de scaffolding-guard fallarán.
- **PowerShell encoding en Windows.** El helper fuerza `[Console]::OutputEncoding
  = UTF8` antes de ejecutar `.ps1`. Sin esto, el em-dash y tildes en los hooks
  PS1 se serializaban en CP1252 y rompían `JSON.parse` del output. Esta
  precaución es **solo para los tests** — en producción Claude Code lee stdout
  como bytes UTF-8 y no se ve afectado.
- **D9 Phase Disjunction es validación semántica LLM, no automatizable.** El
  fixture `parallelizable-phases-overlap.md` sirve como referencia manual
  para auditorías periódicas de plan-checker D9 — caso BLOCKER de fases
  declaradas paralelas que tocan el mismo archivo. Si en el futuro se introduce
  el campo `parallelizable_phases_files:` (mapeo fase→paths declarado en
  `contract:`) entonces sí se puede testear mecánicamente con `node:test`.

## Cómo añadir un caso nuevo

1. Localiza el `*.test.js` del hook a cubrir.
2. Añade un nuevo `test('...', () => { ... })` siguiendo el patrón de los casos
   existentes: usa `makeTmpProject({ __config__: { ... } })` para sembrar
   `.claude/hooks/config.json`, invoca el hook con `invokeJsHook` o
   `invokeShellHook`, y assertea sobre `exitCode` + `stdout`.
3. Si el caso requiere un fixture nuevo, añádelo a `fixtures/` y léelo con
   `readFileSync`.
