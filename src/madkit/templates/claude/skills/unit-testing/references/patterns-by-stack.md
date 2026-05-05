# Patrones de Testing por Stack

> Referencia L2 de la skill `unit-testing`. Cargar solo si el stack del proyecto coincide.

**Sin framework de testing detectado →** indicar al usuario que ejecute `/testing_setup`.

---

## TypeScript/React

- Componentes: `render` → `screen.getByRole` → `userEvent` → assertions
- Hooks: `renderHook` → `act` → verificar estado
- Server Actions: test como funciones async (sin DOM)
- Stubs: `vi.mock()` / `jest.mock()` solo para boundaries (APIs, DB)
- Async: `await waitFor(() => expect(...))` — NUNCA `sleep()`

```typescript
it('muestra error cuando email es inválido', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByRole('textbox', { name: /email/i }), 'invalid');
  await user.click(screen.getByRole('button', { name: /enviar/i }));

  expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
});

// API stub (solo boundaries)
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Ana' }),
}));
```

---

## Python (pytest)

- Fixtures con scope apropiado (`function` default, `session` para conexiones costosas)
- `@pytest.mark.parametrize` para equivalence partitioning
- `pytest-mock` solo para boundaries. `freezegun`/`time-machine` para datetime

```python
@pytest.mark.parametrize("email,valid", [
    ("user@test.com", True),
    ("", False),
    ("no-arroba", False),
    ("a@b.c", True),
])
def test_email_validation(email, valid):
    if valid:
        assert validate_email(email) is True
    else:
        with pytest.raises(ValueError):
            validate_email(email)
```

---

## Django (pytest-django)

- `factory_boy` (NO fixtures JSON, NO creates manuales en setUp)
- `APIClient` para API tests (status + body + side effects)
- `SimpleTestCase` sin DB, `TestCase` con DB
- `assertNumQueries` para detectar N+1

```python
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    name = factory.Faker('name')
    email = factory.LazyAttribute(lambda o: f"{o.name.lower().replace(' ', '.')}@test.com")

@pytest.mark.django_db
def test_create_user_api(api_client):
    response = api_client.post('/api/users/', {'name': 'Ana', 'email': 'ana@test.com'})
    assert response.status_code == 201
    assert response.data['name'] == 'Ana'
    assert User.objects.filter(email='ana@test.com').exists()
```

---

## PHP/Laravel (Pest)

- `it('description')` con expectations encadenables
- `actingAs($user)` + `RefreshDatabase`
- `assertDatabaseHas` / `assertDatabaseMissing` para side effects
- `$this->mock()` solo para servicios externos

```php
uses(RefreshDatabase::class);

it('crea un usuario con datos válidos', function () {
    $response = $this->postJson('/api/users', [
        'name' => 'Ana',
        'email' => 'ana@test.com',
        'password' => 'SecurePass123!',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Ana');

    $this->assertDatabaseHas('users', ['email' => 'ana@test.com']);
});

it('rechaza email duplicado', function () {
    User::factory()->create(['email' => 'ana@test.com']);

    $this->postJson('/api/users', [
        'name' => 'Ana',
        'email' => 'ana@test.com',
        'password' => 'SecurePass123!',
    ])->assertUnprocessable()
      ->assertJsonValidationErrors(['email']);
});
```
