---
name: cleanup-php
description: "Guía PHP 8+/Laravel. Activar proactivamente al editar/crear .php, al refactorizar, limpiar u optimizar código PHP/Laravel. Tipado estricto, patrones modernos, seguridad. NO con .py (cleanup-python) ni .ts (cleanup). Scope: archivos de la tarea activa."
context: fork
agent: implementer
effort: high
paths: ["**/*.php"]
---

# Limpieza y Codificación PHP

> **Propósito:** Guía operativa para proyectos PHP 8+ — tipado estricto, patrones modernos, seguridad y limpieza.

> **Alcance:** Proyectos PHP con Composer. Detectar stack: Laravel, Symfony o PHP genérico.

---

## Detección de Proyecto

| Indicador | Stack | Acción |
|-----------|-------|--------|
| `artisan` + `laravel/framework` en composer.json | Laravel | Comandos `php artisan` |
| `bin/console` + `symfony/framework-bundle` | Symfony | Comandos `php bin/console` |
| `composer.json` + archivos `.php` | PHP genérico | Composer + PHPUnit |

---

## Composer para Dependencias

**Nunca** descargues manualmente ni copies código vendor.

```bash
composer require vendor/package           # producción
composer require --dev phpunit/phpunit     # desarrollo
composer install                           # instalar desde lock
```

---

## Scope y Prioridad de Limpieza

> Reglas de scope universales: ver `cleanup/SKILL.md` §Scope de Limpieza.

**PHP/Laravel específico:** antes de eliminar código "muerto", verificar que no se use vía service container, facades, event listeners, middleware o route model binding. En duda → NO eliminar, preguntar.

**Prioridad:**

1. Sintaxis PHP — `php -l` limpio
2. Análisis estático — PHPStan nivel declarado
3. Código muerto confirmado — solo en archivos de la tarea
4. Type safety — properties/params/returns sin tipo
5. Rendimiento — N+1, eager loading, queries sin optimizar
6. Dependencias — no utilizadas, versiones con vulnerabilidades

## Verificaciones Obligatorias (GATE)

```bash
php -l filename.php                        # 1º: Sintaxis
vendor/bin/phpstan analyse src tests       # 2º: Análisis estático
vendor/bin/pint                            # 3º: Estilo (Laravel) o php-cs-fixer
php artisan test                           # 4º: Tests (Laravel)
# vendor/bin/phpunit                       # Tests (genérico)
```

**La tarea NO está completa hasta que las 4 verificaciones pasen.**

---

## PHP 8+ Moderno (OBLIGATORIO)

Cada archivo PHP requiere `declare(strict_types=1)` como primera instrucción tras `<?php`.

**Características obligatorias:**

| Patrón | Descripción |
|--------|-------------|
| Constructor Promotion | `public readonly int $id` en la firma del constructor |
| Readonly properties | Para DTOs y value objects inmutables |
| Enums (8.1+) | Reemplazar magic strings y constantes de estado |
| Match expressions | Reemplazar switch/case para transformaciones de valor |
| Named arguments | Para claridad en llamadas con múltiples parámetros opcionales |
| Nullsafe operator `?->` | Para cadenas de acceso a objetos nullable |

---

## Code Smells PHP/Laravel

| Code Smell | Corrección |
|------------|-----------|
| **Fat Controller** | Mover lógica a Services/Actions |
| **Magic Strings** | Usar Enums (PHP 8.1+) |
| **N+1 Queries** | Eager loading: `Post::with('user')->get()` |
| **Sin validación** | Form Requests (Laravel) |
| **Mass assignment** | Definir `$fillable` o `$guarded` en modelos |

---

## Patrones Laravel Específicos

**Form Requests:** clase que extiende `FormRequest` con método `rules(): array` retornando reglas de validación. Usar `Password::min(8)->mixedCase()->numbers()` para contraseñas. Inyectar el Form Request en el método del controller — Laravel valida automáticamente antes de ejecutar.

**Query Scopes:** método `scope<Nombre>(Builder $query): void` en el modelo para encapsular querysets reutilizables. Encadenar con otros scopes: `Post::published()->recent()->get()`.

---

## Arquitectura

- **Controllers:** solo orquestación (validar → procesar → responder)
- **Lógica de negocio** en Services/Actions, **NUNCA** en controllers
- **Acceso a datos** en Repositories, no directamente en services
- **DTOs** (readonly classes) para transferencia entre capas

---

## Boundaries (cero tolerancia)

- **SIEMPRE** `declare(strict_types=1)` en cada archivo PHP
- **SIEMPRE** typed properties, parámetros y return types
- **SIEMPRE** queries parametrizadas (ORM/Query Builder) — nunca concatenación de strings SQL
- **SIEMPRE** `@csrf` en formularios Laravel
- **SIEMPRE** `$fillable`/`$guarded` en modelos Eloquent
- **NUNCA** captures `\Exception` genérico — usa excepciones específicas del dominio
- **NUNCA** uses salida sin escapar (`{!! !!}` en Blade sin sanitizar)

## Validación Post-Limpieza

```bash
vendor/bin/phpstan analyse src tests    # 0 errores nuevos (preexistentes fuera de scope)
vendor/bin/pint --test                  # estilo OK
php artisan test                        # todos los tests pasan (o vendor/bin/phpunit)
```

> Si los tests fallan tras limpieza, la limpieza introdujo una regresión — revertir y corregir.
