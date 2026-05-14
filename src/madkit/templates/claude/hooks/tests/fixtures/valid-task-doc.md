# Tarea 999: ejemplo válido para tests

> **Asunciones:** entorno Node ≥20 disponible; el validator T089 admite h3 para "Criterios de Éxito".

---

## 1. Resumen

### Título
Fixture mínima válida para los tests de `task-doc-validator`.

### Objetivo
Probar que un task doc bien formado pasa el validator (h3 + 4 checkboxes).

### Alcance

**Incluye:**
- Esta línea solo existe para que el doc supere las 40 líneas y dispare la heurística "Lifecycle recomendado".

**No incluye:**
- Lógica real — es solo fixture.

### Criterios de Éxito
- [ ] El validator devuelve exit 0 sobre este archivo.
- [ ] No hay BLOCKERs reportados.
- [ ] Los checkboxes son exactamente 4.
- [ ] El test #1 confirma esto en CI.

---

## 2. Wiring esperado

- Ninguno — fixture aislada.

**Tamaño estimado:** 30-50 líneas en 1 archivo nuevo. Tarea SIMPLE.

---

## 3. Cabecera de Metadatos

> **Asunciones:** ver cabecera del doc.

---

## 4. Lifecycle
- **Creado:** 2026-05-05
- **Estado:** ABIERTA
