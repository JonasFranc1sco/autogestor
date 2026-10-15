# Backend — Modelos

Referência de todos os modelos do sistema.

**Multi-tenant:** todo modelo de negócio (`Client`, `Employee`, `Vehicle`,
`Product`, `Service`, `ServiceOrder`) possui FK `workshop → core.Workshop`.
O isolamento é aplicado em `core/tenancy.py`.

---

## Diagrama ER

```
┌──────────────────────────┐
│      core_workshop       │
├──────────────────────────┤
│ id           UUID (PK)   │
│ name         Char(155)   │
│ cnpj         Char(18)    │ (unique)
│ phone        Phone       │
│ email        Email       │
│ address 1:1 → Address    │
│ is_active    Bool        │
│ created_at   DateTime    │
│ updated_at   DateTime    │
└────────────┬─────────────┘
             │ 1:N
     ┌───────┼───────────────┬─────────────────┬───────────────┐
     ▼       ▼               ▼                 ▼               ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│  User  │ │  Client  │ │ Employee │ │   Vehicle    │ │   Product    │
├────────┤ ├──────────┤ ├──────────┤ ├──────────────┤ ├──────────────┤
│ email  │ │ person_  │ │ name     │ │ owner FK ───>││ name         │
│        │ │  type    │ │ phone    │ │  Client      ││ barcode      │
│ full_  │ │ name     │ │ email    │ │ license_plate││ reference    │
│  name  │ │ phone    │ │ document ││  (validada,  ││ cost_price   │
│ role   │ │ email    │ │  _cpf    ││  única/      ││ margin_%     │
│        │ │ document │ │ document ││  oficina)    ││ sale_price   │
│        │ │ (único/  │ │  _rg     ││ year (int)   ││ stock_qty ≥ 0│
│        │ │  oficina)│ │ address  ││ brand, model ││ min_stock    │
│        │ │ address  │ │  1:1 →   ││ color, chassis││ location     │
│        │ │  1:1 →   │ │  Address │└──────────────┘└──────────────┘
│        │ │  Address │ └──────────┘
└────────┘ └──────────┘
```

`core_address` (compartilhado, `OneToOne` com `SET_NULL`):
`cep`, `street`, `number`, `neighborhood`, `city`, `state`, `complement`.

---

## Ordens de Serviço

```
┌───────────────────────────────┐
│      service_order            │
├───────────────────────────────┤
│ id            UUID (PK)       │
│ workshop  FK → Workshop       │
│ number        Int (seq/       │
│               oficina, unique)│
│ client    FK → Client (PROTECT)│
│ vehicle   FK → Vehicle (PROTECT)│
│ mechanic  FK → Employee?      │
│ created_by FK → User?         │
│ status        Char(20)        │── OPEN | IN_PROGRESS | WAITING_PARTS
│ description   Text            │   | WAITING_CLIENT | DONE | CANCELLED
│ observations  Text            │
│ total_price   Decimal(10,2)   │
│ opened_at     DateTime        │
│ closed_at     DateTime?       │
└───────────────┬───────────────┘
                │ 1:N
    ┌───────────┴────────────┐
    ▼                        ▼
┌──────────────────┐  ┌───────────────────┐
│ ServiceOrderItem │  │ ServiceOrderItem  │
│ (Service)        │  │ (Product)         │
├──────────────────┤  ├───────────────────┤
│ service FK       │  │ product FK        │
│  (PROTECT)       │  │  (PROTECT)        │
│ price, discount  │  │ quantity ≥ 1      │
│ discount ≤ price │  │ price, discount   │
│ unique(OS, serv) │  │ unique(OS, prod)  │
└──────────────────┘  └───────────────────┘
```

- `total_price` é sempre recalculado a partir dos itens (read-only na API).
- `number` é sequencial por oficina, atribuído no `save()`.
- Transições de status validadas por `ServiceOrder.STATUS_TRANSITIONS`;
  `DONE`/`CANCELLED` gravam `closed_at` e são terminais.
- Exclusão de `Client`/`Vehicle` usados em OS é bloqueada (`PROTECT`);
  clientes, veículos, produtos, serviços e funcionários usam soft delete
  (`is_active=False`).

---

## Catálogo de Serviços

`services_service`: `name` (único por oficina entre ativos), `description`,
`employee FK?`, `cost_price`, `margin_percentage`, `sale_price`.

---

## Unicidade por oficina

Todas as constraints de unicidade são por `workshop` e consideram apenas
registros `is_active=True` (soft delete não bloqueia recriação):

- `Client.document`, `Employee.document_cpf/rg`, `Vehicle.license_plate`
- `Product.barcode/reference_code`, `Service.name`
- `ServiceOrder.number`
