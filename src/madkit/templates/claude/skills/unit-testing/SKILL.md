---
name: unit-testing
description: "Testing proactivo. Activar SIEMPRE al escribir/modificar código, tras bugfix (regresión obligatoria), y antes de commit si hay archivos sin tests. TDD en tareas complejas. NO para ADK (adk-evaluation-testing) ni setup de infraestructura (testing-setup)."
context: fork
agent: implementer
effort: high
---

# Testing de Calidad

> Tests que verifican comportamiento real. Coverage es el termómetro, no la medicina.

---

## S1. Principio Rector: Calidad > Coverage

**Coverage es una métrica de vanidad si los tests no cubren escenarios reales.** Un test `expect(true).toBe(true)` suma coverage sin verificar nada — genera falsa confianza.

```
1. Diseñar tests que cubran escenarios reales (happy + edge + negative)
2. Escribir tests con assertions significativas (patrón AAA)
3. Verificar calidad (FIRST, test smells, boundary coverage)
4. ENTONCES medir coverage como validación final (≥80% líneas, ≥70% branches)
```

---

## S2. Adopción Progresiva

**Adaptar al nivel de madurez del proyecto.** No imponer framework ni romper trabajo existente.

| Nivel | Estado | Qué hacer | NO hacer |
|-------|--------|-----------|----------|
| **L0** | Sin tests ni framework | Activar la skill `testing-setup`. Smoke tests del critical path | Cubrir todo de golpe. Forzar hooks |
| **L1** | Framework existe, <30% coverage | Añadir negative + boundary a módulos críticos | Bloquear CI por coverage |
| **L2** | >60% coverage, calidad variable | Auditar test smells. Branch coverage. Threshold en CI | Romper flujos CI existentes |
| **L3** | >80% coverage con calidad | Mutation testing periódico. Contract tests | Sobre-optimizar |

**Reglas:**
- Respetar framework existente (si usa Jest, NO migrar a Vitest)
- Tests son archivos nuevos, no modifican código existente
- Pre-commit hooks: sugerir en L0-L1, habilitar en L2, enforcer en L3

### Proporcionalidad y Scope de Tests

**Escribir tests SOLO para código nuevo o modificado en la tarea actual.** No crear tests para código existente que no se ha tocado, aunque carezca de cobertura.

| Tipo de tarea | Tests esperados | NO hacer |
|---------------|----------------|----------|
| **Bugfix** | 1 test de regresión que reproduce el bug + tests directamente afectados por el fix | Suite completa del módulo |
| **Feature nueva** | Tests para la feature (happy + edge + negative) | Tests para código existente no modificado |
| **Refactor** | Tests existentes deben seguir pasando | Añadir tests nuevos salvo gap descubierto en lo refactorizado |
| **Config/infra** | Verificar que tests existentes pasan | Crear tests nuevos |

**NUNCA:** Crear una suite completa de tests para un módulo entero si solo se ha tocado una función.

**Falsos positivos:** Antes de reportar un test fallando como bug, verificar: ¿es un bug real o comportamiento intencional? Revisar comentarios, documentación y tests existentes que expliquen el comportamiento.
- No reescribir tests ajenos salvo que estén rotos

---

## S3. Fundamentos

### 3.1 Principios FIRST

| Principio | Significado | Violación típica |
|-----------|-------------|------------------|
| **Fast** | Ejecución en ms | Servidor real, seed de BD completa |
| **Independent** | Sin dependencia entre tests | Estado compartido, sin tearDown |
| **Repeatable** | Mismo resultado en cualquier entorno | `Date.now()`, `random()`, timezone |
| **Self-validating** | Pasa o falla sin inspección manual | `console.log(result)` sin assertion |
| **Timely** | Se escribe junto al código | Tests como afterthought |

### 3.2 Patrón AAA (Arrange-Act-Assert)

```python
def test_user_creation_with_valid_data():
    # ARRANGE — preparar datos y dependencias
    user_data = {"name": "Ana", "email": "ana@test.com"}

    # ACT — ejecutar UNA acción
    result = create_user(user_data)

    # ASSERT — verificar resultado esperado
    assert result.id is not None
    assert result.name == "Ana"
```

**Un test = un ACT.** Si necesitas dos ACTs, son dos tests.

### 3.3 Pirámide de Testing

| Nivel | Qué testea | Velocidad | Proporción |
|-------|-----------|-----------|------------|
| **Unit** | Función aislada, lógica pura | ms | 70-80% |
| **Integration** | Módulos interactuando (API+DB) | s | 15-25% |
| **E2E** | Flujo completo de usuario | min | 5-10% |

Anti-patrón **ice cream cone**: más E2E que unit → suite lenta, frágil, costosa.

---

## S4. Diseño de Tests

### 4.1 Tipos de escenarios

| Tipo | Definición | Ejemplo |
|------|-----------|---------|
| **Happy path** | Input válido, flujo normal | `getUser(existingId)` → usuario |
| **Edge case** | Input en el LÍMITE del rango válido | `getUser(0)`, lista con 1 elemento |
| **Corner case** | Intersección de 2+ edge cases | Lista vacía + callback null + timeout 0 |
| **Boundary value** | Valores en la frontera: N-1, N, N+1 | page=0, page=1, page=last+1 |
| **Negative test** | Input que DEBE ser rechazado | `createUser(null)` → ValidationError |

**Recomendación: todo test DEBERÍA cubrir al menos happy path + 1 edge + 1 negative.** Para inputs numéricos, boundary value analysis es recomendado. Adaptar al contexto: smoke tests y tests sencillos son válidos en fases tempranas (L0-L1).

### 4.2 Técnicas de diseño

**Equivalence Partitioning:** dividir inputs en clases con mismo comportamiento, testear 1 por clase.
```
calculateDiscount(age):
  Inválido: age < 0     → test con -1
  Niño:     0-12        → test con 6
  Adulto:   13-64       → test con 30
  Senior:   ≥65         → test con 70
  Inválido: null/NaN    → test con null
```

**Boundary Value Analysis:** para cada frontera, testear N-1, N, N+1.
```
Fronteras: 0 (-1,0,1) | 12 (11,12,13) | 64 (63,64,65)
```

**Decision Table:** para lógica con múltiples condiciones combinadas, cada combinación = un test.

### 4.3 Test Doubles (Taxonomía de Meszaros)

NO usar "mock" como término genérico:

| Double | Qué hace | Cuándo |
|--------|----------|--------|
| **Dummy** | Argumento que nunca se usa | Rellenar parámetros obligatorios |
| **Stub** | Retorna datos fijos | Simular respuestas de dependencias |
| **Spy** | Registra llamadas | Verificar que se invocó un side effect |
| **Mock** | Stub + expectativas pre-programadas | Verificar interacción específica (FRÁGIL) |
| **Fake** | Implementación simplificada funcional | In-memory DB, fake SMTP |

**Preferencia:** Stub > Spy > Mock. Mocks acoplan el test a la implementación.

**Solo usar doubles en BOUNDARIES (APIs externas, BD, filesystem, servicios de terceros).** Nunca mockear el SUT ni lógica interna. Si necesitas mockear lógica interna, el diseño tiene un problema de acoplamiento.

---

## S5. Protocolo de Regresión (Bugfixes)

Aplicar el ciclo RED-GREEN de S12 al bug:

| Paso | Acción |
|---|---|
| 1. REPRODUCIR | Test que falla con el bug presente (RED). Sin reproducción = sin garantía de fix. |
| 2. FIXEAR | Corrección mínima que hace pasar el test. Nada más. |
| 3. VALIDAR | Ejecutar suite completa → todos verde. |
| 4. AMPLIAR | Tests adicionales para boundary + corner cases cercanos al bug (parametrizar inputs cuando aplique). |

**Comentario grep-able obligatorio en cada test de regresión** (ver `bugfix/SKILL.md` para variantes por lenguaje): permite búsqueda anti-regresión futura.

Ver S12 para reglas completas del ciclo RED-GREEN-REFACTOR.

---

## S6. Patrones por Stack

**Sin framework de testing detectado →** indicar al usuario que active la skill `testing-setup`.

Los patrones específicos por framework (TypeScript/React, Python pytest, Django, PHP/Laravel Pest) viven en `references/patterns-by-stack.md`. Cargar ese archivo solo si el stack del proyecto coincide.

---

## S7. Escalabilidad

### Time budgets

| Nivel | Target | Máximo | Si se excede |
|-------|--------|--------|-------------|
| Unit individual | <50ms | 200ms | Revisar I/O oculto |
| Unit suite | <15s | 30s | Paralelizar |
| Integration | <60s | 2min | Solo en CI |
| Full suite | <3min | 5min | Sharding |

### Paralelización
```bash
pytest -n auto                          # Python (pytest-xdist)
npx vitest run --pool=threads           # TypeScript
php artisan test --parallel             # PHP
```

### Ejecución selectiva
```bash
npx vitest related --run archivo.ts     # solo tests afectados
pytest --last-failed -x                 # solo lo que falló
pytest -m "not slow"                    # excluir lentos
```

### Flaky tests

| Causa | Fix |
|-------|-----|
| Dependencia temporal | `freezegun` / `vi.useFakeTimers()` |
| Orden de ejecución | Eliminar estado compartido, `--randomly` |
| Race condition | `waitFor()`, eliminar `sleep()` |
| Recurso externo | Stub/fake del recurso |
| Datos no deterministas | Fijar seed, comparar por propiedades |

**Protocolo:** detectar (reruns CI) → aislar (marcar) → arreglar (<48h) o eliminar. Nunca skip permanente.

---

## S8. Test Data

| Estrategia | Cuándo | Ejemplo |
|------------|--------|---------|
| **Inline** | Tests simples | `user = {"name": "Ana"}` |
| **Factory** | Objetos con defaults realistas | `UserFactory.create(role="admin")` |
| **Builder** | Objetos complejos con variaciones | `UserBuilder().with_plan("premium").build()` |
| **Fixture** | Setup reutilizable por módulo | `@pytest.fixture` / `beforeEach` |

**Reglas:**
- Factories > fixtures JSON (dinámicas, mantenibles)
- Cada test crea sus datos (nunca depender de otro test)
- Datos mínimos (solo campos necesarios)
- Nunca datos de producción (GDPR, non-determinismo)

---

## S9. Testing Avanzado

### Concurrencia
Testear cuando hay código async o multi-usuario:
- Doble-click en submit → verificar idempotencia
- Read + write concurrentes → verificar consistencia
- Rate limiting → verificar 429 en request N+1

### Contract testing (APIs)
Consumer: verificar que la respuesta sigue el schema esperado.
Provider: verificar que campos existentes no desaparecen ni cambian de tipo.

### Mutation testing (L3)
Introduce mutaciones en código (cambiar `>` por `>=`) y verifica que los tests las detectan.
- TypeScript: Stryker. Python: mutmut. PHP: Infection.
- Ejecutar en CI nocturno, no en cada commit.

---

## S10. Coverage como Paso Final

**Solo después de que los tests tienen calidad**, medir coverage:

```bash
# Ajustar --cov al directorio raíz del código fuente del proyecto
pytest --cov --cov-branch --cov-report=term-missing --cov-fail-under=80
npx vitest run --coverage   # thresholds en vitest.config.ts
php artisan test --coverage --min=80
```

**Umbrales:** ≥80% líneas + ≥70% branches.

**Excluir:** migraciones, configs, types, `__init__.py`, código generado.

**Checklist de calidad (ANTES de celebrar el %):**
- [ ] Cada test tiene ≥1 assertion que verifica un resultado concreto
- [ ] Hay negative tests (inputs que DEBEN ser rechazados)
- [ ] Hay boundary tests para inputs numéricos/rangos
- [ ] Los tests de side effects verifican el side effect, no solo el return
- [ ] Branch coverage cubre ambos lados de cada condicional
- [ ] **Test "kill the mutant":** comentar/invertir la línea clave del cambio y verificar que ≥1 test del nuevo set falla. Si todos pasan tras la mutación → vanity test, no protege regresión. Sustituto barato de mutation testing automatizado (mutmut, Stryker), captura ~80% del valor sin coste de herramienta.

---

## S11. Anti-Patrones

| Anti-patrón | Qué hacer |
|-------------|-----------|
| Test sin assertion (`render(<Comp />)`) | Añadir `expect(screen.getByText(...))` |
| Assert genérico (`toBeTruthy()`) | `toEqual(expectedValue)` |
| Mock del SUT | Mock solo boundaries |
| `sleep()` en test | `waitFor()`, `act()`, async/await |
| Estado compartido entre tests | Setup/teardown por test |
| Copiar test cambiando 1 valor | `parametrize` / `test.each` |
| `skip` sin ticket | Arreglar o eliminar |
| God test (>30 líneas) | Dividir por concepto |
| Nombre vacío (`"should work"`) | `"returns 404 when user not found"` |
| Test de detalle de implementación | Verificar output, no llamadas internas |
| Coverage inflado con tests triviales | Cada test debe verificar un escenario real |

---

## S12. Flujo TDD (Test-Driven Development)

Activar cuando el usuario pide TDD o desarrollo iterativo seguro.

| Fase | Regla |
|---|---|
| **RED** | Escribir test que describe el comportamiento deseado. Ejecutar. **DEBE fallar** (sin esto, el test no prueba nada nuevo). |
| **GREEN** | Escribir el código **mínimo** para que el test pase. Sin generalizar, sin optimizar, sin anticipar el siguiente test. |
| **REFACTOR** | Limpiar manteniendo tests verdes. Si un test falla durante refactor → revertir. |
| **REPETIR** | Siguiente test para el siguiente comportamiento. Cada ciclo RED-GREEN-REFACTOR < 10 minutos. |

### Reglas innegociables

- Nunca código de producción sin un test rojo primero.
- El test rojo dicta qué código escribir — no anticipar requisitos futuros.
- Código mínimo en GREEN — la generalización emerge del refactor, no de la imaginación.
- Refactor solo con todos los tests verdes.

### Orden canónico de implementación TDD

1. Happy path más simple.
2. Negative tests (rechazos, validaciones, errores).
3. Edge cases (vacíos, nulls, límites).
4. Boundary values (fronteras numéricas N-1, N, N+1).
5. Integración (interacciones entre módulos).

### Conceptos clave aplicables

- **Triangulation:** generalizar la implementación solo cuando un segundo test concreto lo justifica.
- **Fake it till you make it:** primer GREEN puede ser un valor hardcoded; el siguiente RED fuerza la generalización real.
- **Obvious implementation:** cuando la solución es trivial, escribirla directa sin fakes.

---

