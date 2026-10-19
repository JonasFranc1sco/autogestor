from decimal import Decimal

from django.core.management.base import BaseCommand

from clients.models import Client
from core.models import Workshop
from employees.models import Employee
from products.models import Product
from service_order.models import ServiceOrder
from services.models import Service
from users.models import User, Role
from vehicles.models import Vehicle


FIRST_NAMES = [
    "Marcos", "Roberto", "Carlos", "André", "Paulo", "Lucas", "Fernando", "Diego", "Rafael", "Bruno",
    "Tiago", "Rodrigo", "Fábio", "Marcelo", "Leandro", "Vinícius", "Alexandre", "Eduardo", "Matheus", "Guilherme",
    "Daniel", "Henrique", "Samuel", "Leonardo", "Vitor", "Caio", "Igor", "Otávio", "Murilo", "Renato",
    "João", "Maria", "Pedro", "Ana", "Fernanda", "Ricardo", "Juliana", "Gustavo", "Patrícia", "Camila",
    "Letícia", "Felipe", "Amanda", "Larissa", "Gabriel", "Beatriz", "Mariana", "Gabriela", "Aline", "Vanessa",
]

LAST_NAMES = [
    "Silva", "Oliveira", "Santos", "Souza", "Pereira", "Lima", "Gomes", "Costa", "Almeida", "Ribeiro",
    "Carvalho", "Rodrigues", "Martins", "Ferreira", "Araújo", "Barbosa", "Cardoso", "Rocha", "Dias", "Castro",
    "Campos", "Teixeira", "Correia", "Melo", "Mendes", "Moreira", "Freitas", "Vieira", "Monteiro", "Nunes",
]

EMPLOYEE_ROLES = [
    "Mecânico", "Alinhador", "Eletricista", "Suspensão", "Motor", "Freios", "Injeção", "Câmbio", "Diagnóstico", "Auxiliar",
    "Arrefecimento", "Direção", "Escapamento", "Embreagem", "Ar-Condicionado", "Baterias", "Retífica", "Cabeçote", "Pneus", "Revisão",
]

VEHICLE_CATALOG = [
    ("Volkswagen", "Gol"), ("Volkswagen", "Polo"), ("Volkswagen", "Virtus"), ("Volkswagen", "T-Cross"), ("Volkswagen", "Nivus"), ("Volkswagen", "Saveiro"),
    ("Chevrolet", "Onix"), ("Chevrolet", "Tracker"), ("Chevrolet", "Cruze"), ("Chevrolet", "Spin"), ("Chevrolet", "S10"), ("Chevrolet", "Montana"),
    ("Fiat", "Argo"), ("Fiat", "Mobi"), ("Fiat", "Cronos"), ("Fiat", "Pulse"), ("Fiat", "Fastback"), ("Fiat", "Strada"), ("Fiat", "Toro"),
    ("Hyundai", "HB20"), ("Hyundai", "HB20S"), ("Hyundai", "Creta"), ("Hyundai", "Tucson"),
    ("Toyota", "Corolla"), ("Toyota", "Hilux"), ("Toyota", "Yaris"), ("Toyota", "Corolla Cross"), ("Toyota", "SW4"),
    ("Honda", "Civic"), ("Honda", "HR-V"), ("Honda", "City"), ("Honda", "Fit"),
    ("Renault", "Kwid"), ("Renault", "Sandero"), ("Renault", "Logan"), ("Renault", "Duster"), ("Renault", "Oroch"),
    ("Jeep", "Renegade"), ("Jeep", "Compass"), ("Jeep", "Commander"),
    ("Nissan", "Kicks"), ("Nissan", "Versa"), ("Nissan", "Sentra"),
    ("Ford", "Ka"), ("Ford", "Ranger"), ("Ford", "EcoSport"),
    ("Peugeot", "208"), (" Peugeot".strip(), "2008"), ("Citroën", "C3"), ("Citroën", "C4 Cactus"),
]

VEHICLE_COLORS = ["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Verde"]

PRODUCT_BASES = [
    ("Filtro de Óleo", "Mann Filter", Decimal("20.00"), Decimal("45.00")),
    ("Filtro de Ar do Motor", "Tecfil", Decimal("25.00"), Decimal("55.00")),
    ("Filtro de Combustível", "Mahle", Decimal("18.00"), Decimal("40.00")),
    ("Filtro de Cabine (Ar-Condicionado)", "Bosch", Decimal("22.00"), Decimal("50.00")),
    ("Óleo Motor 5W30 Sintético 1L", "Mobil", Decimal("32.00"), Decimal("65.00")),
    ("Óleo Motor 10W40 Semissintético 1L", "Castrol", Decimal("28.00"), Decimal("58.00")),
    ("Jogo de Pastilhas de Freio Dianteiro", "Cobreq", Decimal("65.00"), Decimal("140.00")),
    ("Par de Discos de Freio Ventilado", "Fremax", Decimal("160.00"), Decimal("320.00")),
    ("Fluido de Freio DOT 4 500ml", "Varga", Decimal("19.00"), Decimal("42.00")),
    ("Jogo de Velas de Ignição", "NGK", Decimal("75.00"), Decimal("160.00")),
    ("Jogo de Cabos de Vela", "NGK", Decimal("90.00"), Decimal("190.00")),
    ("Bobina de Ignição", "Bosch", Decimal("145.00"), Decimal("290.00")),
    ("Correia Dentada", "Gates", Decimal("55.00"), Decimal("120.00")),
    ("Tensor da Correia Dentada", "SKF", Decimal("85.00"), Decimal("180.00")),
    ("Correia do Alternador (Poli-V)", "Continental", Decimal("40.00"), Decimal("90.00")),
    ("Bomba d'Água", "Urba", Decimal("110.00"), Decimal("230.00")),
    ("Válvula Termostática", "MTE-Thomson", Decimal("60.00"), Decimal("130.00")),
    ("Aditivo de Radiador Concentrado 1L", "Paraflu", Decimal("20.00"), Decimal("45.00")),
    ("Amortecedor Dianteiro", "Cofap", Decimal("210.00"), Decimal("420.00")),
    ("Amortecedor Traseiro", "Monroe", Decimal("150.00"), Decimal("310.00")),
    ("Kit Batente e Coifa do Amortecedor", "Axios", Decimal("48.00"), Decimal("105.00")),
    ("Bieleta da Barra Estabilizadora", "Nakata", Decimal("38.00"), Decimal("85.00")),
    ("Pivô de Suspensão", "Nakata", Decimal("52.00"), Decimal("115.00")),
    ("Terminal de Direção", "Viemar", Decimal("45.00"), Decimal("98.00")),
    ("Kit de Embreagem (Platô, Disco e Rolamento)", "Luk", Decimal("380.00"), Decimal("750.00")),
    ("Junta Homocinética", "Spicer", Decimal("120.00"), Decimal("250.00")),
    ("Rolamento de Roda Dianteira", "SKF", Decimal("70.00"), Decimal("150.00")),
    ("Bateria 60Ah Livre de Manutenção", "Moura", Decimal("290.00"), Decimal("520.00")),
    ("Sonda Lambda (Sensor de Oxigênio)", "Bosch", Decimal("165.00"), Decimal("340.00")),
    ("Bomba de Combustível Elétrica", "Bosch", Decimal("130.00"), Decimal("270.00")),
]

SERVICE_ORDER_DESCRIPTIONS = [
    ("Revisão preventiva e troca de óleo", Decimal("140.00")),
    ("Alinhamento 3D e balanceamento das 4 rodas", Decimal("120.00")),
    ("Verificação do sistema elétrico e teste de bateria", Decimal("250.00")),
    ("Troca de amortecedores dianteiros e kit batente", Decimal("850.00")),
    ("Retífica de cabeçote e substituição de juntas", Decimal("1500.00")),
    ("Substituição de pastilhas e discos de freio", Decimal("420.00")),
    ("Limpeza de bicos injetores e corpo de borboleta", Decimal("180.00")),
    ("Troca completa do kit de embreagem", Decimal("950.00")),
    ("Diagnóstico computadorizado da injeção eletrônica", Decimal("150.00")),
    ("Revisão de 50.000 km completa", Decimal("600.00")),
    ("Troca de correia dentada e tensor", Decimal("580.00")),
    ("Higienização e recarga de gás do ar-condicionado", Decimal("220.00")),
    ("Substituição de bomba d'água e limpeza do arrefecimento", Decimal("390.00")),
    ("Troca de velas e cabos de ignição", Decimal("280.00")),
    ("Reparo na caixa de direção hidráulica", Decimal("1100.00")),
    ("Troca de fluido de freio com sangria eletrônica", Decimal("130.00")),
    ("Substituição de bandejas, buchas e pivôs da suspensão", Decimal("490.00")),
    ("Troca de silencioso traseiro do escapamento", Decimal("320.00")),
    ("Troca de rolamento de roda dianteira", Decimal("260.00")),
    ("Manutenção no alternador e troca da correia poli-V", Decimal("440.00")),
]

STATUS_CYCLE = [
    ServiceOrder.Status.OPEN,
    ServiceOrder.Status.IN_PROGRESS,
    ServiceOrder.Status.WAITING_PARTS,
    ServiceOrder.Status.WAITING_CLIENT,
    ServiceOrder.Status.DONE,
    ServiceOrder.Status.CANCELLED,
]


def _make_plate(index: int) -> str:
    """Gera uma placa Mercosul única e válida (formato ABC1D23) para index >= 0."""
    l1 = chr(ord("A") + (index // 2600) % 26)
    l2 = chr(ord("A") + (index // 100) % 26)
    l3 = chr(ord("A") + (index // 10) % 26)
    d1 = index % 10
    l4 = chr(ord("A") + (index % 26))
    d23 = (index * 7) % 100
    return f"{l1}{l2}{l3}{d1}{l4}{d23:02d}"


class Command(BaseCommand):
    help = "Cria uma oficina de demonstração com 300 itens de cada modelo (dev/testes)."

    def add_arguments(self, parser):
        parser.add_argument("--email", default="admin@demo.com")
        parser.add_argument("--password", default="senhaForte123")
        parser.add_argument("--count", type=int, default=300)

    def handle(self, *args, **options):
        total = options["count"]

        workshop, _ = Workshop.objects.get_or_create(
            name="Oficina Demonstração",
            defaults={"cnpj": "00.000.000/0001-91", "email": "contato@demo.com"},
        )

        user, user_created = User.objects.get_or_create(
            email=options["email"],
            defaults={
                "full_name": "Admin Demonstração",
                "role": Role.ADMIN,
                "workshop": workshop,
            },
        )
        if user_created:
            user.set_password(options["password"])
            user.save(update_fields=["password"])

        # 1. Funcionários (300)
        employees = []
        for i in range(total):
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            role_suffix = EMPLOYEE_ROLES[i % len(EMPLOYEE_ROLES)]
            name = f"{first} {role_suffix} {i + 1}"
            cpf = f"{11122230001 + i:011d}"
            phone = f"+556298{1000000 + i:07d}"
            email = f"funcionario{i + 1}@demo.com"

            emp, _ = Employee.objects.get_or_create(
                workshop=workshop,
                document_cpf=cpf,
                defaults={
                    "name": name,
                    "phone": phone,
                    "email": email,
                },
            )
            employees.append(emp)

        # 2. Clientes (300)
        clients = []
        for i in range(total):
            first = FIRST_NAMES[(i * 3) % len(FIRST_NAMES)]
            last = LAST_NAMES[(i * 7) % len(LAST_NAMES)]
            name = f"{first} {last} {i + 1}"
            doc = f"{12345670001 + i:011d}"
            phone = f"+556299{1000000 + i:07d}"
            email = f"cliente{i + 1}@teste.com"

            client, _ = Client.objects.get_or_create(
                workshop=workshop,
                document=doc,
                defaults={
                    "name": name,
                    "phone": phone,
                    "email": email,
                },
            )
            clients.append(client)

        # 3. Veículos (300)
        vehicles = []
        for i in range(total):
            brand, model = VEHICLE_CATALOG[i % len(VEHICLE_CATALOG)]
            color = VEHICLE_COLORS[i % len(VEHICLE_COLORS)]
            year = 2015 + (i % 10)
            plate = "BRA2E19" if i == 0 else _make_plate(i)

            vehicle, _ = Vehicle.objects.get_or_create(
                workshop=workshop,
                license_plate=plate,
                defaults={
                    "owner": clients[i],
                    "brand": brand,
                    "model": model,
                    "year": year,
                    "color": color,
                    "mileage": Decimal(str(15000 + (i * 1250))),
                },
            )
            vehicles.append(vehicle)

        # 4. Produtos (300)
        for i in range(total):
            base_name, brand, cost_price, sale_price = PRODUCT_BASES[i % len(PRODUCT_BASES)]
            batch_num = (i // len(PRODUCT_BASES)) + 1
            name = f"{base_name} #{batch_num}" if batch_num > 1 else base_name
            ref_code = f"REF-{i + 1:04d}"
            barcode = f"7891000{i + 1:06d}"
            stock_qty = (i * 3) % 40
            min_stock = 5

            Product.objects.get_or_create(
                workshop=workshop,
                reference_code=ref_code,
                defaults={
                    "name": name,
                    "barcode": barcode,
                    "brand": brand,
                    "supplier": f"Distribuidora AutoPeças {(i % 5) + 1}",
                    "cost_price": cost_price,
                    "sale_price": sale_price,
                    "stock_quantity": stock_qty,
                    "min_stock_quantity": min_stock,
                    "location": f"Corredor {chr(ord('A') + (i % 6))}, Prateleira {(i % 10) + 1}",
                },
            )

        # Serviço padrão do catálogo
        Service.objects.get_or_create(
            workshop=workshop,
            name="Troca de óleo e filtro",
            defaults={
                "cost_price": Decimal("30.00"),
                "sale_price": Decimal("100.00"),
            },
        )

        # 5. Ordens de Serviço (300)
        existing_os_count = ServiceOrder.objects.filter(workshop=workshop).count()
        for i in range(existing_os_count, total):
            desc, price = SERVICE_ORDER_DESCRIPTIONS[i % len(SERVICE_ORDER_DESCRIPTIONS)]
            status = STATUS_CYCLE[i % len(STATUS_CYCLE)]

            ServiceOrder.objects.create(
                workshop=workshop,
                client=clients[i],
                vehicle=vehicles[i],
                mechanic=employees[i],
                created_by=user,
                description=f"{desc} (OS Demo #{i + 1})",
                status=status,
                total_price=price,
                odometer=15000 + (i * 1250),
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Oficina de demonstração populada com {total} itens por modelo. "
                f"Login: {options['email']} / {options['password']}"
            )
        )
