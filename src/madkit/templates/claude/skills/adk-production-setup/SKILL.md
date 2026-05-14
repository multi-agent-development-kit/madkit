---
name: adk-production-setup
description: "[ADK] En proyectos Google ADK (google-adk SDK): configuración de producción, sessions, servicios, API server, deployment. Activar al desplegar en Cloud Run/Agent Engine o pasar agentes ADK de desarrollo a producción."
paths: ["**/agent.py", "**/agents/**", "**/adk/**/*.py", "**/pyproject.toml"]
---

Eres un Especialista en Configuración de Producción ADK. Guías la transición de un sistema de agentes desde desarrollo local hasta producción, configurando servicios, API y deployment.

---

## 1. Session Backends

### Matriz de decisión

| Escenario | Backend | Connection String |
|-----------|---------|-------------------|
| Dev/testing rápido | `InMemorySessionService()` | Sin string — todo en memoria |
| Persistencia local (1 proceso) | `SqliteSessionService(db_path)` | `./sessions.db` |
| Producción (PostgreSQL) | `DatabaseSessionService(db_url)` | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| Producción (Supabase) | `DatabaseSessionService(db_url)` | `postgresql+asyncpg://user:pass@host.supabase.co:5432/postgres` |
| Producción (MySQL) | `DatabaseSessionService(db_url)` | `mysql+aiomysql://user:pass@host:3306/dbname` |
| Google Cloud nativo | `VertexAiSessionService(...)` | `project`, `location`, `agent_engine_id` |

**Drivers async requeridos:** `asyncpg` (PostgreSQL) · `aiomysql` (MySQL) · `aiosqlite` (SQLite).

**DatabaseSessionService** soporta: `pool_pre_ping=True` (auto), row-level locking, stale session detection.

**VertexAiSessionService:** instanciar con `project=`, `location=`, `agent_engine_id=`.

### Anti-patrones de sessions

- **InMemory en producción** — datos perdidos en cada reinicio
- **SQLite en multi-proceso** — no soporta row-level locking, causa corrupción
- **Sin async driver** — requerido por el framework
- **Credenciales en código** — usar `os.environ["DATABASE_URL"]`

---

## 2. State Scoping

ADK soporta 3 niveles de estado con prefijos:

| Prefijo | Alcance | Persiste entre |
|---------|---------|---------------|
| (sin prefijo) | Sesión | Invocaciones de la misma sesión |
| `app:` | Aplicación | Todos los usuarios y sesiones |
| `user:` | Usuario | Todas las sesiones del mismo usuario |
| `temp:` | Invocación | NO persiste — efímero |

**En callbacks:** usar `ctx.state` (delta-aware). **En tools:** usar `tool_context.state`. Al leer, se recibe el merge de los 3 niveles; al escribir, el prefijo determina dónde persiste.

---

## 3. Servicios (Memory + Artifacts)

### Wiring del runner

`Runner(app=app, session_service=..., artifact_service=..., memory_service=...)` — `session_service` es OBLIGATORIO; los otros son opcionales.

`App(name=..., root_agent=..., plugins=[...])` — plugins se configuran en la App, no en el Runner.

### Memory Services

| Escenario | Servicio | Configuración clave |
|-----------|---------|---------------------|
| Dev/testing | `InMemoryMemoryService()` | Sin config |
| Producción (semántico) | `VertexAiMemoryBankService(...)` | `project=`, `location=` |
| Producción (RAG) | `VertexAiRagMemoryService(rag_corpus=...)` | `rag_corpus=` (ID completo del corpus), `similarity_top_k=5` |

**Guardar desde tool:** `await tool_context.add_session_to_memory()`. **Buscar:** `memory_service.search_memory(app_name, user_id, query)`.

### Artifact Services

| Escenario | Servicio | Configuración |
|-----------|---------|---------------|
| Dev/testing | `InMemoryArtifactService()` | Sin config |
| Local | `FileArtifactService(base_dir="./artifacts")` | Directorio local |
| Producción | `GcsArtifactService(bucket_name="my-bucket")` | Bucket GCS |

**Namespacing cross-session:** prefijo `user:` en filename (`"user:profile_photo"`) para persistencia entre sesiones del mismo usuario.

---

## 4. Plugin Lifecycle

### Orden de ejecución (verificado contra BasePlugin)

```
1.  on_user_message_callback    — Mensaje del usuario recibido
2.  before_run_callback         — Antes de iniciar el runner (setup)
3.  before_agent_callback       — Antes de ejecutar lógica del agente
4.  before_model_callback       — Antes de enviar request al LLM
5.  after_model_callback        — Después de recibir respuesta del LLM
    on_model_error_callback     — Si el LLM falla (en vez de after_model)
6.  before_tool_callback        — Antes de ejecutar una tool
7.  after_tool_callback         — Después de ejecutar una tool
    on_tool_error_callback      — Si la tool falla (en vez de after_tool)
8.  after_agent_callback        — Después de completar el agente
9.  on_event_callback           — Después de cada event yielded
10. after_run_callback          — Al finalizar el runner (cleanup)
11. close                       — Al cerrar el runner
```

**Precedencia:** plugins se ejecutan ANTES que callbacks del agente. Un plugin que modifica `llm_request` en `before_model_callback` es visto ya modificado por el callback del agente.

### Stacks recomendados por entorno

| Entorno | Plugins |
|---------|---------|
| DEV | `DebugLoggingPlugin(output_path, include_session_state, include_system_instruction)` + `LoggingPlugin()` |
| STAGING | `ReflectAndRetryToolPlugin(max_retries=2)` + `ContextFilterPlugin(num_invocations_to_keep=10)` + `LoggingPlugin()` |
| PRODUCCIÓN | `ContextFilterPlugin(num_invocations_to_keep=5)` + `SaveFilesAsArtifactsPlugin()` + OpenTelemetry (Arize AX o Phoenix) |

### Custom Plugin

Extender `BasePlugin` (de `google.adk.plugins.base_plugin`). Sobrescribir los callbacks necesarios del orden anterior. Usar `callback_context.state["temp:key"]` para estado efímero entre callbacks. Reportar en `after_run_callback`.

---

## 5. API Server

### `adk web` vs `adk api_server`

| Comando | Uso | Incluye |
|---------|-----|---------|
| `adk web` | Desarrollo — UI interactiva + API | Angular UI en `/dev-ui/` + REST API |
| `adk api_server` | Producción — solo API | REST API sin UI, soporta `--auto_create_session` |

### Endpoints clave

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/health` | Health check — `{"status": "ok"}` |
| `GET` | `/list-apps` | Listar agentes disponibles |
| `POST` | `/run` | Ejecutar agente (respuesta completa) |
| `POST` | `/run_sse` | Ejecutar con streaming SSE |
| `WS` | `/run_live` | WebSocket bidireccional (audio/video) |
| `POST` | `/apps/{app}/users/{user}/sessions` | Crear sesión |
| `GET/DELETE` | `/apps/{app}/users/{user}/sessions/{id}` | Obtener / eliminar sesión |

### SSE — regla crítica

Los eventos con `partial=True` son fragmentos progresivos. El evento con `partial=False` es la respuesta completa agregada. **NO mostrar ambos o se duplica el texto.** Patrón: si `data.partial` → append (typewriter); si `!data.partial` → replace con versión final.

### Flags de `adk api_server` (producción)

`--host 0.0.0.0 --port 8000 --session_service_uri <uri> --artifact_service_uri <uri> --auto_create_session --allow_origins <url> --log_level INFO --a2a agents/ --trace_to_cloud --otel_to_cloud`

---

## 6. Deployment

### Cloud Run

```bash
adk deploy cloud_run \
  --project my-project \
  --region us-central1 \
  --service_name my-agent-api \
  --with_ui \
  --trace_to_cloud
```

### Variables de entorno (producción)

| Variable | Propósito |
|----------|-----------|
| `GOOGLE_API_KEY` | API key para Gemini |
| `GOOGLE_CLOUD_PROJECT` | Proyecto GCP (telemetría) |
| `PORT` | Puerto del servidor |
| `DATABASE_URL` | Session backend URI |

### Service URIs

| Prefijo URI | Servicio |
|-------------|---------|
| `memory://` | InMemorySessionService |
| `sqlite:///path` | SqliteSessionService |
| `postgresql+asyncpg://` | DatabaseSessionService (PostgreSQL) |
| `mysql+aiomysql://` | DatabaseSessionService (MySQL) |
| `agentengine://projects/...` | VertexAiSessionService |
| `gs://bucket/path` | GcsArtifactService |

### Checklist pre-deploy

**Infraestructura:**
- [ ] Session backend configurado (no InMemory)
- [ ] Credenciales en variables de entorno (no hardcoded)
- [ ] CORS configurado si frontend es SPA separada
- [ ] Health endpoint verificado (`GET /health`)
- [ ] Plugins de producción configurados (ContextFilterPlugin mínimo)
- [ ] Telemetría habilitada (`--trace_to_cloud` o `--otel_to_cloud`)
- [ ] Si el agente usa `SkillToolset`: directorio `skills/` empaquetado en artefacto de deploy. Compliance agentskills.io validado (ver `adk-skills-toolset`)

**Seguridad y costes (ver subagent `adk` § Protocolo de Seguridad ADK):**
- [ ] `max_llm_calls` configurado en RunConfig (default 500 es excesivo)
- [ ] Grep de credenciales: 0 secretos hardcoded
- [ ] Guardrails configurados si el agente maneja datos sensibles o es público
- [ ] Estimación de coste por request documentada

**Testing (OBLIGATORIO — ver subagent `adk` § Gate de Testing):**
- [ ] Evalsets ejecutados — mínimo 3 POR AGENTE principal (happy path + tool trajectory + edge case)
- [ ] `safety_v1` ≥ 0.9 en eval config
- [ ] `hallucinations_v1` ≥ 0.8 en eval config
- [ ] Regresión ejecutada si es cambio sobre sistema existente

> Ejemplos de deployment y arquitecturas: `ai_docs/refs/adk-samples/` si disponible en el proyecto, o documentación oficial ADK
