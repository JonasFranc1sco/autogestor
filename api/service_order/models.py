from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.db.models import F, Q
from core.models import BaseModel, Workshop
from clients.models import Client
from users.models import User
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

    STATUS_TRANSITIONS = {
        Status.OPEN: {Status.IN_PROGRESS, Status.WAITING_PARTS, Status.WAITING_CLIENT, Status.CANCELLED},
        Status.IN_PROGRESS: {Status.WAITING_PARTS, Status.WAITING_CLIENT, Status.DONE, Status.CANCELLED},
        Status.WAITING_PARTS: {Status.IN_PROGRESS, Status.CANCELLED},
        Status.WAITING_CLIENT: {Status.IN_PROGRESS, Status.CANCELLED},
        Status.DONE: set(),
        Status.CANCELLED: set(),
    }

    CLOSED_STATUSES = {Status.DONE, Status.CANCELLED}

    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='service_orders',
        verbose_name='Oficina',
    )
    number = models.PositiveIntegerField(editable=False, help_text="Número sequencial da OS na oficina")
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="service_orders")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name="service_orders")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_service_orders",
        verbose_name="Criada por",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    description = models.TextField(blank=True, null=True, help_text="Descrição do serviço solicitado")
    observations = models.TextField(blank=True, null=True, help_text="Observações internas")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Valor total do serviço")
    odometer = models.PositiveIntegerField(
        blank=True, null=True, verbose_name="Quilometragem",
        help_text="Hodômetro do veículo no momento do serviço",
    )
    stock_released = models.BooleanField(
        default=False,
        editable=False,
        verbose_name="Estoque devolvido",
        help_text="Marca que as peças da OS já foram devolvidas ao estoque",
    )
    opened_at = models.DateTimeField(auto_now_add=True, verbose_name="Aberta em")
    closed_at = models.DateTimeField(blank=True, null=True, verbose_name="Encerrada em")

    class Meta(BaseModel.Meta):
        verbose_name = 'Ordem de Serviço'
        verbose_name_plural = 'Ordens de Serviço'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['workshop', 'number'],
                name='uniq_service_order_number_per_workshop',
            ),
        ]

    def __str__(self):
        return f"OS #{self.number} — {self.client.name}"

    def save(self, *args, **kwargs):
        from django.utils import timezone

        if self.status in self.CLOSED_STATUSES and self.closed_at is None:
            self.closed_at = timezone.now()

        if self._state.adding and not self.number:
            from django.db import transaction

            with transaction.atomic():
                # Trava a linha da oficina para serializar a numeração.
                Workshop.objects.select_for_update().filter(pk=self.workshop_id).first()
                last_number = (
                    ServiceOrder.objects
                    .filter(workshop_id=self.workshop_id)
                    .order_by("-number")
                    .values_list("number", flat=True)
                    .first()
                )
                self.number = (last_number or 0) + 1
                return super().save(*args, **kwargs)
        super().save(*args, **kwargs)

    @property
    def paid_total(self):
        return sum(payment.amount for payment in self.payments.all())

    @property
    def balance(self):
        return self.total_price - self.paid_total

    def calculate_total(self):
        services_total = sum(item.total_price for item in self.services.all())
        products_total = sum(item.total_price for item in self.products.all())

        return services_total + products_total

    def can_transition_to(self, new_status):
        return new_status in self.STATUS_TRANSITIONS.get(self.status, set())


class ServiceOrderService(BaseModel):
    service_order = models.ForeignKey(ServiceOrder, on_delete=models.CASCADE, related_name="services")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="service_order_items")
    mechanic = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_order_services",
        verbose_name="Mecânico",
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0.00"))])

    class Meta(BaseModel.Meta):
        verbose_name = 'Serviço da OS'
        verbose_name_plural = 'Serviços da OS'
        constraints = [
            models.UniqueConstraint(
                fields=['service_order', 'service'],
                name='uniq_service_per_service_order',
            ),
            models.CheckConstraint(
                condition=Q(price__gte=0) & Q(discount__gte=0),
                name='service_order_service_values_non_negative',
            ),
            models.CheckConstraint(
                condition=Q(discount__lte=F('price')),
                name='service_order_service_discount_not_above_price',
            ),
        ]

    @property
    def total_price(self):
        return self.price - self.discount


class ServiceOrderProduct(BaseModel):
    service_order = models.ForeignKey(ServiceOrder, on_delete=models.CASCADE, related_name="products")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="service_order_items")
    seller = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_order_products", verbose_name="Vendedor / Atendente")
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0.00"))])

    class Meta(BaseModel.Meta):
        verbose_name = 'Produto da OS'
        verbose_name_plural = 'Produtos da OS'
        constraints = [
            models.UniqueConstraint(
                fields=['service_order', 'product'],
                name='uniq_product_per_service_order',
            ),
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name='service_order_product_quantity_at_least_one',
            ),
            models.CheckConstraint(
                condition=Q(price__gte=0) & Q(discount__gte=0),
                name='service_order_product_values_non_negative',
            ),
            models.CheckConstraint(
                condition=Q(discount__lte=F('price') * F('quantity')),
                name='service_order_product_discount_not_above_total',
            ),
        ]

    @property
    def total_price(self):
        return (self.price * self.quantity) - self.discount


class ServiceOrderEvent(BaseModel):
    """Evento do histórico de uma ordem de serviço (timeline)."""

    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="events",
        verbose_name="Ordem de Serviço",
    )
    from_status = models.CharField(max_length=20, blank=True, null=True, verbose_name="Status anterior")
    to_status = models.CharField(max_length=20, blank=True, null=True, verbose_name="Novo status")
    description = models.CharField(max_length=255, verbose_name="Descrição")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="service_order_events",
        verbose_name="Registrado por",
    )

    class Meta(BaseModel.Meta):
        verbose_name = 'Evento da OS'
        verbose_name_plural = 'Eventos da OS'
        ordering = ['created_at']


class ServiceOrderPayment(BaseModel):
    """Pagamento registrado para uma ordem de serviço."""

    class Method(models.TextChoices):
        CASH = "CASH", "Dinheiro"
        PIX = "PIX", "PIX"
        CREDIT = "CREDIT", "Cartão de crédito"
        DEBIT = "DEBIT", "Cartão de débito"
        TRANSFER = "TRANSFER", "Transferência"

    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name="service_order_payments",
        verbose_name="Oficina",
    )
    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name="Ordem de Serviço",
    )
    method = models.CharField(max_length=10, choices=Method.choices, verbose_name="Forma de pagamento")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor pago")
    paid_at = models.DateTimeField(auto_now_add=True, verbose_name="Pago em")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="service_order_payments",
        verbose_name="Registrado por",
    )

    class Meta(BaseModel.Meta):
        verbose_name = 'Pagamento da OS'
        verbose_name_plural = 'Pagamentos da OS'
        ordering = ['-paid_at']
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name='service_order_payment_amount_positive',
            ),
        ]

    def __str__(self):
        return f"Pagamento {self.amount} — OS #{self.service_order.number}"


def attachment_upload_to(instance, filename):
    import os
    import uuid

    ext = os.path.splitext(filename)[1].lower()
    return f"service_orders/{uuid.uuid4().hex}{ext}"


class ServiceOrderAttachment(BaseModel):
    """Anexo de uma ordem de serviço (fotos, laudos, notas)."""

    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Ordem de Serviço",
    )
    file = models.FileField(upload_to=attachment_upload_to, verbose_name="Arquivo")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descrição")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="uploaded_attachments",
        verbose_name="Enviado por",
    )

    class Meta(BaseModel.Meta):
        verbose_name = 'Anexo da OS'
        verbose_name_plural = 'Anexos da OS'
        ordering = ['-created_at']

    def __str__(self):
        return f"Anexo {self.description or self.file.name} — OS #{self.service_order.number}"
