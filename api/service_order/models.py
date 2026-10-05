from django.db import models
from core.models import BaseModel
from clients.models import Client
from vehicles.models import Vehicle
from employees.models import Employee
from services.models import Service
from products.models import Product

class ServiceOrder(BaseModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Aberta"
        IN_PROGRESS = "IN_PROGRESS", "Em andamento"
        WAITING_PARTS = "WAITING_PARTS", "Aguardando peças"
        WAITING_CLIENT = "WAITING_CLIENT", "Aguardando cliente"
        DONE = "DONE", "Concluída"
        CANCELLED = "CANCELLED", "Cancelada"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="service_orders")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="service_orders")
    mechanic = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    description = models.TextField(blank=True, null=True, help_text="Descrição do serviço solicitado")
    observations = models.TextField(blank=True, null=True, help_text="Observações internas")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Valor total do serviço")

    def __str__(self):
        return f"OS — {self.client.name}"
    
    def calculate_total(self):
        services_total = sum(item.total_price for item in self.services.all())
        products_total = sum(item.total_price for item in self.products.all())
        
        return services_total + products_total

class ServiceOrderService(BaseModel):
    service_order = models.ForeignKey(ServiceOrder, on_delete=models.CASCADE, related_name="services")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="service_order_items")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    @property
    def total_price(self):
        return (self.unit_price * self.quantity) - self.discount
    
class ServiceOrderProduct(BaseModel):
    service_order = models.ForeignKey(ServiceOrder, on_delete=models.CASCADE, related_name="products")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="service_order_items")
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    @property
    def total_price(self):
        return (self.unit_price * self.quantity) - self.discount