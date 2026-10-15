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
