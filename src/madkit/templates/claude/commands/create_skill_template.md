# Crear Skill de Claude Code

> Guía para crear skills personalizados en formato moderno `carpeta/SKILL.md`. Produce una skill desplegable en `.claude/skills/` con frontmatter YAML, auto-activación y archivos de soporte opcionales.

---

## Paso 1: Planificación

Definir antes de escribir:

```
Nombre: /[kebab-case-name]
Propósito: [Qué hace en una línea]
Activación: [Cuándo debería activarse automáticamente]
NO activar: [Para qué NO debería usarse — exclusiones mutuas]
```

### Nivel de Complejidad

| Nivel | Secciones | Líneas | Usar Cuando |
|-------|----------|--------|-------------|
| Ligero | 2-3 | 40-80 | Operación enfocada única |
| Estándar | 4-6 | 80-200 | Workflow multi-paso |
| Completo | 6+ | 200+ | Workflow complejo, árboles de decisión |

Elegir el nivel mínimo que cubra el caso de uso.

---

## Paso 2: Crear Estructura de Carpeta

```
.claude/skills/
└── nombre-de-skill/          # kebab-case obligatorio
    ├── SKILL.md               # Archivo principal (obligatorio)
    ├── reference.md           # Documentación detallada (opcional)
    ├── examples/              # Ejemplos de uso (opcional)
    └── scripts/               # Scripts auxiliares (opcional)
```

**Reglas de nombres:**
- Carpeta: `kebab-case` (ej. `cleanup-python`, `adk-workflow-design`)
- El campo `name:` del frontmatter DEBE coincidir con el nombre de la carpeta
- Archivo principal: siempre `SKILL.md` (mayúsculas)

---

## Paso 3: Escribir Frontmatter YAML

```yaml
---
name: nombre-de-skill
description: "Qué hace + cuándo activar + cuándo NO activar. Máximo ~200 caracteres."
argument-hint: "[argumento opcional]"
---
```

### Campos Disponibles

| Campo | Obligatorio | Propósito |
|-------|-------------|-----------|
| `name` | Sí | Identificador kebab-case, coincide con carpeta |
| `description` | Sí | Trigger de auto-activación — se carga siempre en contexto |
| `argument-hint` | No | Pista de autocompletado en UI (ej. `"[archivo] [formato]"`) |
| `allowed-tools` | No | Restringir herramientas (ej. `Read, Grep, Glob`) |
| `context: fork` | No | Ejecutar en subagente aislado (para skills de solo lectura) |
| `user-invocable: false` | No | Ocultar del menú `/` (solo Claude puede activar) |
| `model` | No | Override de modelo (`sonnet`, `opus`, `haiku`) |
| `disable-model-invocation: true` | No | Solo invocación manual con `/nombre` |

### Escribir Descriptions Efectivas

**Fórmula:** `Qué hace` + `Cuándo activar` + `Cuándo NO activar`

```yaml
# ✅ Efectiva — triggers claros + exclusiones mutuas
description: "Guía de codificación Python 3.10+. Activar al editar archivos .py en proyectos SIN manage.py. Con manage.py o django → usar cleanup-django."

# ❌ Inefectiva — vaga, sin triggers
description: "Ayuda con código Python."
```

**Presupuesto de tokens:** Las descriptions de TODOS los skills se cargan al inicio de sesión. Mantener cada una bajo ~200 caracteres para minimizar consumo de contexto.

**Variables disponibles en el contenido:**
- `$ARGUMENTS` — todos los argumentos del usuario como string
- `$0`, `$1`, `$2` — argumentos posicionales
- `${CLAUDE_SKILL_DIR}` — ruta de la carpeta del skill

---

## Paso 4: Escribir Contenido del Skill

### Estructura Canónica

```markdown
---
name: nombre-de-skill
description: "..."
---

# Título del Skill

> Descripción breve de qué hace y cuándo usarlo.

**Input:** `$ARGUMENTS` — [descripción del input esperado]

---

## Paso 1: [Primera Acción]

[Instrucciones imperativas]

---

## Paso 2: [Segunda Acción]

[Instrucciones imperativas]

---

## Reglas

1. **Regla principal** — descripción
2. **Otra regla** — descripción
```

### Guías de Redacción

**Ser imperativo:**
- ✅ "Listar todos los archivos modificados"
- ❌ "Deberías listar todos los archivos modificados"

**Ser específico:**
- ✅ "Verificar si `package.json` existe en la raíz del proyecto"
- ❌ "Verificar archivos de configuración del proyecto"

**Incluir puntos de decisión:**
```markdown
Si [condición]:
  → [acción A]
Si [otra condición]:
  → [acción B]
```

**Usar plantillas de output** para asegurar resultados consistentes:
```markdown
| Archivo | Estado | Acción |
|---------|--------|--------|
| ... | ... | ... |
```

**Referenciar otros skills** al final para prevenir confusión:
```markdown
*Para [propósito relacionado pero diferente], usar `/otro-skill`.*
```

---

## Paso 5: Validar

### Checklist de Calidad

- [ ] Carpeta en `.claude/skills/` con nombre `kebab-case`
- [ ] `SKILL.md` con frontmatter YAML válido
- [ ] Campo `name:` coincide exactamente con nombre de carpeta
- [ ] `description:` bajo ~200 caracteres con triggers + exclusiones
- [ ] Título H1 presente (exactamente uno)
- [ ] Blockquote descriptivo después del H1
- [ ] Separador `---` después del blockquote y entre secciones
- [ ] Headers de sección usan `## Paso N:` (español)
- [ ] Todo el contenido en español (términos técnicos en su idioma original)
- [ ] Sin placeholders vacíos (TODO, TBD, FIXME)
- [ ] Sin emojis en headers
- [ ] Bloques de código balanceados
- [ ] Referencia cruzada a skills relacionados al final

### Verificar Auto-Activación

Tras crear el skill, verificar que Claude Code lo detecta:
1. Abrir nueva sesión — el skill debería aparecer en autocompletado de `/`
2. Probar con un prompt que coincida con la `description`
3. Verificar que NO se activa con prompts de skills relacionados (exclusiones mutuas)

---

## Ejemplo: Skill Ligero (~50 líneas)

```markdown
---
name: verificar-dependencias
description: "Escanear dependencias desactualizadas o vulnerables. Activar cuando el usuario pida auditar dependencias, buscar vulnerabilidades, o actualizar paquetes."
---

# Verificar Dependencias

> Escanea el proyecto en busca de dependencias desactualizadas o con vulnerabilidades.

---

## Paso 1: Detectar Gestor de Paquetes

Verificar qué archivos existen:
- `package.json` → npm/yarn/pnpm
- `pyproject.toml` → uv/pip
- `composer.json` → composer

---

## Paso 2: Ejecutar Auditoría

Ejecutar el comando de auditoría apropiado y presentar:

| Paquete | Actual | Última | Severidad |
|---------|--------|--------|-----------|
| ... | ... | ... | ... |

---

*Para aplicar actualizaciones, usar el gestor de paquetes directamente. Este skill solo reporta.*
```

---

## Ubicación de Despliegue

| Alcance | Ruta | Cuándo |
|---------|------|--------|
| Proyecto | `.claude/skills/nombre/SKILL.md` | Skills específicos de un proyecto |
| Personal | `~/.claude/skills/nombre/SKILL.md` | Skills disponibles en todos tus proyectos |
