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

## Scope de Limpieza

- **Solo archivos de la tarea actual.** No expandir limpieza a módulos adyacentes. Issues fuera del scope → documentar como nota, no actuar.
- **Antes de eliminar código "muerto":** Verificar que no se use vía service container, facades, event listeners, middleware, route model binding u otros mecanismos indirectos de Laravel/PHP. En caso de duda → NO eliminar, preguntar al usuario.

## Verificaciones Obligatorias (GATE)

**Ejecuta INMEDIATAMENTE después de crear o editar cualquier archivo PHP:**

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

### `declare(strict_types=1)` en cada archivo

```php
<?php
declare(strict_types=1);

namespace App\Services;
// ...
```

### Constructor Promotion + Readonly + Enums

```php
class User
{
    public function __construct(
        public readonly int $id,
        public string $name,
        public UserStatus $status = UserStatus::Active,
        public ?string $bio = null,
    ) {}

    public function getRoleName(): string
    {
        return match ($this->role) {
            UserRole::Admin => 'Administrator',
            UserRole::User => 'User',
        };
    }
}
```

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

### Form Requests para validación

```php
class RegisterUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ];
    }
}
```

### Query Scopes para querysets reutilizables

```php
class Post extends Model
{
    public function scopePublished(Builder $query): void
    {
        $query->where('status', 'published')
              ->whereNotNull('published_at')
              ->where('published_at', '<=', now());
    }
}

// Uso: Post::published()->recent()->get();
```

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
