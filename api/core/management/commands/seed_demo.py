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


class Command(BaseCommand):
    help = "Cria uma oficina de demonstração com dados de exemplo (dev/testes)."

    def add_arguments(self, parser):
        parser.add_argument("--email", default="admin@demo.com")
        parser.add_argument("--password", default="senhaForte123")

    def handle(self, *args, **options):
        workshop, created = Workshop.objects.get_or_create(
            name="Oficina Demonstração",
            defaults={"cnpj": "00.000.000/0001-91", "email": "contato@demo.com"},
        )
        if not created:
            self.stdout.write("Oficina de demonstração já existe; nada a fazer.")
            return

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

        Employee.objects.create(workshop=workshop, name="Marcos Mecânico")
        client = Client.objects.create(
            workshop=workshop, name="João Silva", document="12345678901",
            email="joao@teste.com", phone="+5562999990000",
        )
        Vehicle.objects.create(
            workshop=workshop, owner=client, brand="Volkswagen", model="Gol",
            license_plate="BRA2E19", year=2020,
        )
        Product.objects.create(
            workshop=workshop, name="Filtro de Óleo", cost_price=Decimal("20.00"),
            sale_price=Decimal("40.00"), stock_quantity=15, min_stock_quantity=5,
        )
        Service.objects.create(
            workshop=workshop, name="Troca de óleo e filtro",
            cost_price=Decimal("30.00"), sale_price=Decimal("100.00"),
        )
        ServiceOrder.objects.create(
            workshop=workshop, client=client,
            vehicle=Vehicle.objects.get(workshop=workshop),
            description="Revisão preventiva", total_price=Decimal("0.00"),
        )

        self.stdout.write(self.style.SUCCESS(
            f"Oficina de demonstração criada. Login: {options['email']} / {options['password']}"
        ))
