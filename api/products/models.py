from django.db import models
from django.db.models import Q
from core.models import BaseModel, Workshop


class Product(BaseModel):
    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name='Oficina',
    )

    name = models.CharField(max_length=255, help_text="Nome do produto")
    reference_code = models.CharField(max_length=50, blank=True, null=True, help_text="Referência do produto")
    barcode = models.CharField(max_length=50, blank=True, null=True, help_text="Código de barras (EAN)")
    description = models.TextField(blank=True, null=True, help_text="Descrição detalhada ou aplicação")
    application = models.CharField(max_length=255, blank=True, null=True, help_text="Aplicação do produto")

    supplier = models.CharField(max_length=50, blank=True, null=True, help_text="Fornecedor do produto")
    brand = models.CharField(max_length=50, blank=True, null=True, help_text="Marca do produto")

    cost_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de custo pago ao fornecedor")
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Margem desejada em %")
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de venda para o cliente")

    warranty_days = models.PositiveIntegerField(
        default=90, blank=True, null=True,
        help_text="Garantia do produto em dias (0 ou vazio = sem garantia)",
    )
    stock_quantity = models.IntegerField(default=0, help_text="Quantidade atual no estoque")
    min_stock_quantity = models.IntegerField(default=5, blank=True, null=True, help_text="Estoque mínimo para alerta de reposição")
    location = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Localização física na oficina (ex: Corredor A, Prateleira 3)"
    )

    class Meta(BaseModel.Meta):
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['name']
        constraints = [
            models.CheckConstraint(
                condition=Q(stock_quantity__gte=0),
                name='product_stock_not_negative',
            ),
            models.UniqueConstraint(
                fields=['workshop', 'barcode'],
                condition=Q(is_active=True) & ~Q(barcode=None) & ~Q(barcode=''),
                name='uniq_product_barcode_per_workshop',
            ),
            models.UniqueConstraint(
                fields=['workshop', 'reference_code'],
                condition=Q(is_active=True) & ~Q(reference_code=None) & ~Q(reference_code=''),
                name='uniq_product_reference_per_workshop',
            ),
        ]

    def __str__(self):
        return self.name


class StockMovement(BaseModel):
    """Movimentação de estoque (entrada, saída ou ajuste)."""

    class MovementType(models.TextChoices):
        IN = 'IN', 'Entrada'
        OUT = 'OUT', 'Saída'
        ADJUST = 'ADJUST', 'Ajuste'

    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='stock_movements',
        verbose_name='Oficina',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='stock_movements',
        verbose_name='Produto',
    )
    movement_type = models.CharField(
        max_length=10,
        choices=MovementType.choices,
        verbose_name='Tipo',
    )
    quantity = models.IntegerField(
        help_text="Delta da movimentação: positivo entra, negativo sai"
    )
    reason = models.CharField(max_length=255, help_text="Motivo da movimentação")
    service_order = models.ForeignKey(
        'service_order.ServiceOrder',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='stock_movements',
        verbose_name='Ordem de Serviço',
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='stock_movements',
        verbose_name='Registrado por',
    )
    stock_after = models.IntegerField(verbose_name='Estoque após movimentação')

    class Meta(BaseModel.Meta):
        verbose_name = 'Movimentação de Estoque'
        verbose_name_plural = 'Movimentações de Estoque'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=~Q(quantity=0),
                name='stock_movement_quantity_not_zero',
            ),
        ]

    def __str__(self):
        return f"{self.get_movement_type_display()} {self.quantity} — {self.product.name}"
