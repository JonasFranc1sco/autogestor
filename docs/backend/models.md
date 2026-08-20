# Backend — Modelos

Referência completa de todos os modelos do sistema.

---

## Diagrama ER

```
┌─────────────────────────┐
│      users_user         │
├─────────────────────────┤
│ id           UUID (PK)  │
│ email        Email      │
│ full_name    Char(255)  │
│ role         Char(20)   │─── ADMIN | MANAGER | MECHANIC | ATTENDANT
│ is_staff     Bool       │
│ is_active    Bool       │
│ password     Char(128)  │
│ created_at   DateTime   │
│ updated_at   DateTime   │
└─────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│    clients_address      │     │     clients_client      │
├─────────────────────────┤     ├─────────────────────────┤
│ id           BigAuto(PK)│◄────│ address FK → Address    │
│ cep          Char(8)    │     │ id           UUID (PK)  │
│ street       Char(255)  │     │ person_type  Char(2)    │─── PF | PJ
│ number       Char(10)   │     │ name         Char(255)  │
│ neighborhood Char(100)  │     │ phone        Phone      │
│ city         Char(100)  │     │ email        Email      │
│ state        Char(2)    │     │ document     Char(18)   │ (unique)
│ complement   Text(255)  │     │ responsible  Char(155)  │
└─────────────────────────┘     │ is_active    Bool       │
                                │ created_at   DateTime   │
                                │ updated_at   DateTime   │
                                └───────────┬─────────────┘
                                            │ 1:N
                                            ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   employees_address     │     │   vehicles_vehicle      │
├─────────────────────────┤     ├─────────────────────────┤
│ id           BigAuto(PK)│     │ id           UUID (PK)  │
│ cep          Char(8)    │     │ owner FK ──────────────>│ clients_client
│ street       Char(255)  │     │ license_plate Char(7)   │
│ number       Char(10)   │     │ brand        Char(50)   │
│ neighborhood Char(100)  │     │ model        Char(155)  │
│ city         Char(100)  │     │ color        Char(50)   │
│ state        Char(2)    │     │ chassis      Char(155)  │
│ complement   Text(255)  │     │ is_active    Bool       │
└───────────┬─────────────┘     │ created_at   DateTime   │
            │ 1:N               │ updated_at   DateTime   │
            ▼                   └─────────────────────────┘
┌─────────────────────────┐
│  employees_employee     │
├─────────────────────────┤
│ id           UUID (PK)  │
│ name         Char(155)  │
│ phone        Phone      │
│ email        Email      │
│ address FK → Address    │
│ document_cpf Char(18)   │ (unique)
│ document_rg  Char(18)   │ (unique)
│ is_active    Bool       │
│ created_at   DateTime   │
│ updated_at   DateTime   │
└─────────────────────────┘

┌─────────────────────────┐
│    products_product     │
├─────────────────────────┤
│ id                UUID  │
│ name         Char(255)  │
│ reference_code Char(50) │
│ barcode      Char(50)   │ (nullable)
│ description    Text     │ (nullable)
│ supplier     Char(50)   │
│ brand        Char(50)   │
│ cost_price   Dec(10,2)  │
│ margin_pct   Dec(5,2)   │
│ sale_price   Dec(10,2)  │
│ stock_qty    Int         │
│ min_stock    Int (5)    │
│ location     Char(50)   │ (nullable)
│ is_active    Bool       │
│ created_at   DateTime   │
│ updated_at   DateTime   │
└─────────────────────────┘
```

---

## core — BaseModel

Modelo abstrato herdado por todos os modelos de domínio.

| Campo | Tipo | Configuração |
|-------|------|--------------|
| `id` | UUIDField | primary_key, default=uuid4 |
| `created_at` | DateTimeField | auto_now_add=True |
| `updated_at` | DateTimeField | auto_now=True |
| `is_active` | BooleanField | default=True |

---

## users — User

Modelo customizado, herda de `AbstractBaseUser` + `PermissionsMixin` + `BaseModel`.

| Campo | Tipo | Configuração |
|-------|------|--------------|
| `email` | EmailField | unique=True, USERNAME_FIELD |
| `full_name` | CharField | max_length=255 |
| `role` | CharField | choices=Role, default=ATTENDANT |
| `is_staff` | BooleanField | default=False |

### Roles

| Valor | Label | Permissões |
|-------|-------|------------|
| `ADMIN` | Administrador | Acesso total |
| `MANAGER` | Gerente | Lista usuários |
| `MECHANIC` | Mecânico | Próprio perfil |
| `ATTENDANT` | Atendente | Próprio perfil (padrão) |

---

## clients — Client

| Campo | Tipo | Configuração |
|-------|------|--------------|
| `person_type` | CharField(2) | PF/PJ, default=PF |
| `name` | CharField(255) | Nome do cliente |
| `phone` | PhoneNumberField | blank=True |
| `email` | EmailField | max_length=254 |
| `address` | FK → Address | on_delete=CASCADE |
| `document` | CharField(18) | unique=True, nullable (CPF/CNPJ) |
| `responsible` | CharField(155) | nullable (Responsável/Frotista) |

---

## vehicles — Vehicle

| Campo | Tipo | Configuração |
|-------|------|--------------|
| `owner` | FK → Client | on_delete=CASCADE |
| `license_plate` | CharField(7) | Placa |
| `brand` | CharField(50) | Marca |
| `model` | CharField(155) | Modelo |
| `color` | CharField(50) | Cor |
| `chassis` | CharField(155) | Chassi |

---

## employees — Employee

| Campo | Tipo | Configuração |
|-------|------|--------------|
| `name` | CharField(155) | Nome completo |
| `phone` | PhoneNumberField | blank=True |
| `email` | EmailField | max_length=254 |
| `address` | FK → Address | on_delete=CASCADE |
| `document_cpf` | CharField(18) | unique=True, nullable |
| `document_rg` | CharField(18) | unique=True, nullable |

---

## products — Product

| Campo | Tipo | Configuração |
|-------|------|--------------|
| `name` | CharField(255) | Nome do produto |
| `reference_code` | CharField(50) | Referência |
| `barcode` | CharField(50) | Código de barras (nullable) |
| `description` | TextField | Descrição (nullable) |
| `supplier` | CharField(50) | Fornecedor |
| `brand` | CharField(50) | Marca |
| `cost_price` | DecimalField(10,2) | Preço de custo |
| `margin_percentage` | DecimalField(5,2) | Margem em % |
| `sale_price` | DecimalField(10,2) | Preço de venda |
| `stock_quantity` | IntegerField | Qtd atual (default=0) |
| `min_stock_quantity` | IntegerField | Estoque mínimo (default=5) |
| `location` | CharField(50) | Localização física (nullable) |

---

## Notas

1. **Address duplicado** — `clients.Address` e `employees.Address` são idênticos
2. **Campos redundantes** — Employee, Product e Vehicle redeclaram created_at/updated_at
3. **Client.name** — Declarado duas vezes no código
4. **Address sem BaseModel** — Usa BigAutoField padrão
