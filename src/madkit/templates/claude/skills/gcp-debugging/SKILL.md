---
name: gcp-debugging
description: "Diagnóstico GCP/Cloud Run. Activar proactivamente ante errores de deploy, logs de producción GCP, problemas con Cloud Run, EventArc, IAM, o servicios desplegados. NO para bugs de código local (→ bugfix)."
effort: low
---

# Depuracion de Despliegues en GCP

> Comandos CLI para troubleshooting en Google Cloud Platform. Reemplazar `[SERVICE_NAME]`, `[PROJECT_ID]`, `[REGION]`, `[BUCKET_NAME]`, `[SECRET_NAME]` con valores reales.

---

## Diagnostico Rapido

```bash
# Estado del servicio
gcloud run services describe [SERVICE_NAME] --region=[REGION] --format="table(status.conditions[0].type,status.conditions[0].status,status.conditions[0].message)"

# URL del servicio
gcloud run services describe [SERVICE_NAME] --region=[REGION] --format="value(status.url)"

# Logs recientes (1h)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=[SERVICE_NAME]" --limit=50 --freshness=1h

# Solo errores
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=[SERVICE_NAME] AND (severity=ERROR OR textPayload:FATAL OR textPayload:failed)" --limit=20 --freshness=2h

# Logs en tiempo real
gcloud run logs read [SERVICE_NAME] --region=[REGION] --follow

# Secrets
gcloud secrets versions access latest --secret=[SECRET_NAME]
gcloud secrets versions access latest --secret=[SECRET_NAME] | hexdump -C  # verificar saltos de linea

# Permisos de service account
gcloud projects get-iam-policy [PROJECT_ID] --flatten="bindings[].members" --format="table(bindings.role,bindings.members)"
gcloud secrets get-iam-policy [SECRET_NAME]
```

---

## Problemas Comunes

### 1. Conexion a Base de Datos

**Sintomas:** `FATAL: database "postgres\n" does not exist`

```bash
# Verificar saltos de linea en secret (causa comun)
gcloud secrets versions access latest --secret=[SECRET_NAME] | hexdump -C

# CRITICO: usar printf (echo agrega salto de linea)
printf "postgresql://user:pass@host:5432/dbname" | gcloud secrets versions add [SECRET_NAME] --data-file=-

# Reiniciar servicio
gcloud run services update [SERVICE_NAME] --region=[REGION] --update-env-vars=RESTART_TIMESTAMP=$(date +%s)
```

### 2. Permisos de Secrets

**Sintomas:** `Permission denied on secret`, `403 Forbidden`

```bash
# Verificar quien tiene acceso
gcloud run services describe [SERVICE_NAME] --region=[REGION] --format="value(spec.template.spec.serviceAccountName)"

# Otorgar acceso
gcloud secrets add-iam-policy-binding [SECRET_NAME] \
    --member="serviceAccount:[SERVICE_NAME]@[PROJECT_ID].iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. EventArc Trigger

**Sintomas:** Subidas de archivos no activan procesamiento

```bash
gcloud eventarc triggers list --location=[REGION]

# Permisos necesarios
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
EVENTARC_SA="service-${PROJECT_NUMBER}@gcp-sa-eventarc.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding [PROJECT_ID] \
    --member="serviceAccount:${EVENTARC_SA}" \
    --role="roles/pubsub.publisher"

# Crear trigger
gcloud eventarc triggers create [TRIGGER_NAME] \
    --destination-run-service=[SERVICE_NAME] \
    --destination-run-region=[REGION] \
    --destination-run-path=/ \
    --event-filters="type=google.cloud.storage.object.v1.finalized" \
    --event-filters="bucket=[BUCKET_NAME]" \
    --location=[REGION] \
    --service-account=[SERVICE_NAME]@[PROJECT_ID].iam.gserviceaccount.com
```

### 4. Storage Bucket (CORS)

```bash
gcloud storage buckets describe gs://[BUCKET_NAME] --format="value(cors)"

# Configurar CORS
cat > cors-config.json << EOF
[{"origin": ["*"], "method": ["GET","POST","PUT","DELETE","OPTIONS"], "responseHeader": ["Content-Type","Authorization","Range"], "maxAgeSeconds": 3600}]
EOF
gcloud storage buckets update gs://[BUCKET_NAME] --cors-file=cors-config.json
rm cors-config.json

# Otorgar acceso
gcloud storage buckets add-iam-policy-binding gs://[BUCKET_NAME] \
    --member=serviceAccount:[SERVICE_NAME]@[PROJECT_ID].iam.gserviceaccount.com \
    --role=roles/storage.objectAdmin
```

### 5. APIs No Habilitadas

```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com storage.googleapis.com \
    secretmanager.googleapis.com eventarc.googleapis.com aiplatform.googleapis.com pubsub.googleapis.com
```

---

## Recuperacion

```bash
# Prueba manual del servicio
SERVICE_URL=$(gcloud run services describe [SERVICE_NAME] --region=[REGION] --format="value(status.url)")
curl -X GET "${SERVICE_URL}/health" -H "X-API-Key: $(gcloud secrets versions access latest --secret=[API_KEY_SECRET])" -v

# Trafico y revisiones
gcloud run revisions list --service=[SERVICE_NAME] --region=[REGION] --limit=5

# Rollback a revision anterior
gcloud run services update-traffic [SERVICE_NAME] --region=[REGION] --to-revisions=REVISION_NAME=100

# Rotacion de secrets
printf "$(openssl rand -base64 32)" | gcloud secrets versions add [API_KEY_SECRET] --data-file=-
gcloud run services update [SERVICE_NAME] --region=[REGION] --update-env-vars=RESTART_TIMESTAMP=$(date +%s)

# Variables de entorno del servicio
gcloud run services describe [SERVICE_NAME] --region=[REGION] --format="table(spec.template.spec.template.spec.containers[].env[].name,spec.template.spec.template.spec.containers[].env[].value)"
```
