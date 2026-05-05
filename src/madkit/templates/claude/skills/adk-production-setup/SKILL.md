---
name: adk-production-setup
description: "ADK a producción: sessions, servicios, API server, deployment. Activar al configurar backend de sesiones, desplegar en Cloud Run/Agent Engine, o pasar agentes ADK de desarrollo a producción. Skill del agente adk."
---

Eres un Especialista en Configuración de Producción ADK. Guías la transición de un sistema de agentes desde desarrollo local hasta producción, configurando servicios, API y deployment.

---

## 1. Session Backends

### Matriz de Decisión

| Escenario | Backend | Connection String |
|-----------|---------|-------------------|
| Dev/testing rápido | `InMemorySessionService()` | Sin string — todo en memoria |
| Persistencia local (1 proceso) | `SqliteSessionService(db_path)` | `./sessions.db` o `sqlite+aiosqlite:///./sessions.db` |
| Producción (PostgreSQL) | `DatabaseSessionService(db_url)` | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| Producción (Supabase) | `DatabaseSessionService(db_url)` | `postgresql+asyncpg://user:pass@host.supabase.co:5432/postgres` |
| Producción (MySQL) | `DatabaseSessionService(db_url)` | `mysql+aiomysql://user:pass@host:3306/dbname` |
| Google Cloud nativo | `VertexAiSessionService(...)` | `project`, `location`, `agent_engine_id` |

### Configuración por Backend

```python
# InMemory (dev only — datos se pierden al reiniciar)
from google.adk.sessions import InMemorySessionService
session_service = InMemorySessionService()

# SQLite (persistencia local, 1 proceso)
from google.adk.sessions.sqlite_session_service import SQLiteSessionService
session_service = SQLiteSessionService("./sessions.db")

# PostgreSQL / Supabase (producción, multi-instancia)
from google.adk.sessions import DatabaseSessionService
session_service = DatabaseSessionService(
    "postgresql+asyncpg://user:pass@host:5432/dbname"
)
# Soporta: pool_pre_ping=True (auto), row-level locking, stale session detection

# VertexAI (cloud-native, Google managed)
from google.adk.sessions import VertexAiSessionService
session_service = VertexAiSessionService(
    project="my-project",
    location="us-central1",
    agent_engine_id="1234567890",
)
```

### Anti-Patrones de Sessions

- **InMemory en producción** — datos perdidos en cada reinicio
- **SQLite en multi-proceso** — no soporta row-level locking, causa corrupción
- **Sin async driver** — usar `asyncpg` (PostgreSQL), `aiomysql` (MySQL), `aiosqlite` (SQLite)
- **Credenciales en código** — usar variables de entorno: `os.environ["DATABASE_URL"]`

---

## 2. State Scoping

ADK soporta 3 niveles de estado con prefijos:

| Prefijo | Alcance | Persiste entre | Ejemplo |
|---------|---------|---------------|---------|
| (sin prefijo) | Sesión | Invocaciones de la misma sesión | `state["research_findings"]` |
| `app:` | Aplicación | Todos los usuarios y sesiones | `state["app:model_config"]` |
| `user:` | Usuario | Todas las sesiones del mismo usuario | `state["user:preferences"]` |
| `temp:` | Invocación | NO persiste — efímero | `state["temp:draft"]` |

```python
# En callbacks: usar ctx.state (delta-aware)
def init_state(ctx: CallbackContext) -> None:
    ctx.state["app:version"] = "1.0"           # Compartido entre usuarios
    ctx.state["user:language"] = "es"           # Persiste entre sesiones del usuario
    ctx.state["temp:processing"] = True         # Solo esta invocación
    ctx.state["context"] = "session-scoped"     # Persiste en la sesión

# En tools: usar tool_context.state
def my_tool(query: str, tool_context: ToolContext) -> dict:
    lang = tool_context.state.get("user:language", "en")
    tool_context.state["temp:last_query"] = query  # Efímero
    return {"result": "..."}
```

**Regla:** Al leer estado en una sesión, se recibe el merge de los 3 niveles. Al escribir, el prefijo determina dónde persiste.

---

## 3. Servicios (Memory + Artifacts)

### Wiring Completo

```python
from google.adk.runners import Runner
from google.adk.apps import App

app = App(name="my_app", root_agent=root_agent, plugins=[...])

runner = Runner(
    app=app,
    session_service=session_service,        # OBLIGATORIO
    artifact_service=artifact_service,      # Opcional — para archivos
    memory_service=memory_service,          # Opcional — para contexto entre sesiones
)
```

### Memory Services

| Escenario | Servicio | Configuración |
|-----------|---------|---------------|
| Dev/testing | `InMemoryMemoryService()` | Sin config |
| Producción (semántico) | `VertexAiMemoryBankService(...)` | Proyecto + location |
| Producción (RAG) | `VertexAiRagMemoryService(rag_corpus=...)` | Corpus ID + similarity_top_k |

```python
# RAG Memory (búsqueda semántica en conversaciones pasadas)
from google.adk.memory.vertex_ai_rag_memory_service import VertexAiRagMemoryService
memory_service = VertexAiRagMemoryService(
    rag_corpus="projects/my-project/locations/us-central1/ragCorpora/123",
    similarity_top_k=5,
)
```

**Guardar en memoria desde tool:** `await tool_context.add_session_to_memory()`
**Buscar memoria:** `memory_service.search_memory(app_name, user_id, query)`

### Artifact Services

| Escenario | Servicio | Configuración |
|-----------|---------|---------------|
| Dev/testing | `InMemoryArtifactService()` | Sin config |
| Local | `FileArtifactService(base_dir="./artifacts")` | Directorio local |
| Producción | `GcsArtifactService(bucket_name="my-bucket")` | Bucket GCS |

**Namespacing:** Prefijo `user:` en filename para persistencia cross-session:
```python
await artifact_service.save_artifact(
    app_name="my_app", user_id="user1",
    filename="user:profile_photo",  # Persiste entre sesiones
    artifact=image_part,
)
```

---

## 4. Plugin Lifecycle

### Orden de Ejecución (verificado contra BasePlugin)

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

**Precedencia:** Plugins se ejecutan ANTES que callbacks del agente. Si un plugin modifica el request en `before_model_callback`, el callback del agente ve el request ya modificado.

### Stacks Recomendados por Entorno

```python
# DEV — máxima visibilidad
from google.adk.plugins import DebugLoggingPlugin, LoggingPlugin
plugins = [
    DebugLoggingPlugin(output_path="adk_debug.yaml"),
    LoggingPlugin(),
]

# STAGING — protección + visibilidad
from google.adk.plugins import ReflectAndRetryToolPlugin, LoggingPlugin
from google.adk.plugins.context_filter_plugin import ContextFilterPlugin
plugins = [
    ReflectAndRetryToolPlugin(max_retries=2),
    ContextFilterPlugin(num_invocations_to_keep=10),
    LoggingPlugin(),
]

# PRODUCCIÓN — rendimiento + resiliencia
from google.adk.plugins.context_filter_plugin import ContextFilterPlugin
from google.adk.plugins.save_files_as_artifacts_plugin import SaveFilesAsArtifactsPlugin
plugins = [
    ContextFilterPlugin(num_invocations_to_keep=5),
    SaveFilesAsArtifactsPlugin(),
    # + OpenTelemetry para observabilidad (ver docs de Arize AX o Phoenix)
]
```

### Custom Plugin

```python
from google.adk.plugins.base_plugin import BasePlugin

class MetricsPlugin(BasePlugin):
    def __init__(self):
        super().__init__(name="metrics_plugin")

    async def before_model_callback(self, *, callback_context, llm_request):
        # Registrar métricas antes de cada llamada LLM
        callback_context.state["temp:llm_call_count"] = (
            callback_context.state.get("temp:llm_call_count", 0) + 1
        )

    async def after_run_callback(self, *, invocation_context):
        # Reportar métricas al finalizar
        count = invocation_context.session.state.get("temp:llm_call_count", 0)
        logger.info(f"Total LLM calls: {count}")
```

---

## 5. API Server

### `adk web` vs `adk api_server`

| Comando | Uso | Incluye |
|---------|-----|---------|
| `adk web` | Desarrollo — UI interactiva + API | Angular UI en `/dev-ui/` + REST API |
| `adk api_server` | Producción — solo API | REST API sin UI, soporta `--auto_create_session` |

### Endpoints Clave

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/health` | Health check (returns `{"status": "ok"}`) |
| `GET` | `/list-apps` | Listar agentes disponibles |
| `POST` | `/run` | Ejecutar agente (respuesta completa) |
| `POST` | `/run_sse` | Ejecutar con streaming SSE (eventos parciales) |
| `WS` | `/run_live` | WebSocket bidireccional (audio/video) |
| `POST` | `/apps/{app}/users/{user}/sessions` | Crear sesión |
| `GET` | `/apps/{app}/users/{user}/sessions/{id}` | Obtener sesión |
| `DELETE` | `/apps/{app}/users/{user}/sessions/{id}` | Eliminar sesión |

### Consumir SSE sin Duplicados

```python
# Frontend (JavaScript)
const eventSource = new EventSource('/run_sse', { method: 'POST', body: ... });

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.partial) {
        // Texto progresivo — mostrar como typewriter
        appendText(data.content.parts[0].text);
    } else {
        // Evento final — respuesta completa
        replaceWithFinal(data.content);
    }
};
```

**Regla crítica SSE:** Los eventos con `partial=True` son fragmentos progresivos. El evento con `partial=False` es la respuesta completa agregada. NO mostrar ambos o se duplica el texto.

### Configuración del Servidor

```bash
# Dev con UI
adk web --host 0.0.0.0 --port 8000 --reload_agents

# Producción con auto-create session
adk api_server \
  --host 0.0.0.0 --port 8000 \
  --session_service_uri "postgresql+asyncpg://user:pass@host/db" \
  --artifact_service_uri "gs://my-bucket/artifacts" \
  --auto_create_session \
  --allow_origins "https://myapp.com" \
  --log_level INFO

# Con A2A protocol
adk api_server --a2a agents/

# Con telemetría cloud
adk api_server --trace_to_cloud --otel_to_cloud agents/
```

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

### Variables de Entorno (producción)

| Variable | Propósito | Ejemplo |
|----------|-----------|---------|
| `GOOGLE_API_KEY` | API key para Gemini | `AIza...` |
| `GOOGLE_CLOUD_PROJECT` | Proyecto GCP (para telemetría) | `my-project` |
| `PORT` | Puerto del servidor | `8000` |
| `DATABASE_URL` | Session backend | `postgresql+asyncpg://...` |

### Service URIs

| Prefijo URI | Servicio |
|-------------|---------|
| `memory://` | InMemorySessionService |
| `sqlite:///path` | SqliteSessionService |
| `postgresql+asyncpg://` | DatabaseSessionService (PostgreSQL) |
| `mysql+aiomysql://` | DatabaseSessionService (MySQL) |
| `agentengine://projects/...` | VertexAiSessionService |
| `gs://bucket/path` | GcsArtifactService |

### Checklist Pre-Deploy

**Infraestructura:**
- [ ] Session backend configurado (no InMemory)
- [ ] Credenciales en variables de entorno (no hardcoded)
- [ ] CORS configurado si frontend es SPA separada
- [ ] Health endpoint verificado (`GET /health`)
- [ ] Plugins de producción configurados (ContextFilterPlugin mínimo)
- [ ] Telemetría habilitada (--trace_to_cloud o --otel_to_cloud)
- [ ] Si el agente usa `SkillToolset`: directorio `skills/` empaquetado en el artefacto de deploy (Dockerfile `COPY skills/ ./skills/` o equivalente). Compliance agentskills.io validado (ver `adk-skills-toolset`)

**Seguridad y Costes (ver subagent `adk` § Protocolo de Seguridad ADK):**
- [ ] `max_llm_calls` configurado en RunConfig (default 500 es excesivo — ajustar al caso de uso real)
- [ ] Grep de credenciales: 0 secretos hardcoded en código fuente
- [ ] Guardrails configurados si el agente maneja datos sensibles o es público
- [ ] Estimación de coste por request documentada

**Testing (OBLIGATORIO — ver subagent `adk` § Gate de Testing):**
- [ ] Evalsets ejecutados — mínimo 3 POR AGENTE principal (happy path + tool trajectory + edge case)
- [ ] `safety_v1` ≥ 0.9 en eval config
- [ ] `hallucinations_v1` ≥ 0.8 en eval config
- [ ] Regresión ejecutada si es cambio sobre sistema existente

> Ejemplos de deployment y arquitecturas: `ai_docs/refs/adk-samples/`
