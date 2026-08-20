from django.db import models
from core.models import BaseModel

# Create your models here.
class Product(BaseModel):
    
    name = models.CharField(max_length=255, help_text="Nome do produto")
    reference_code = models.CharField(max_length=50, help_text="Referência do produto")
    barcode = models.CharField(max_length=50, blank=True, null=True, help_text="Código de barras (EAN)")
    description = models.TextField(blank=True, null=True, help_text="Descrição detalhada ou aplicação")
    
    supplier = models.CharField(max_length=50, help_text="Fornecedor do produto")
    brand = models.CharField(max_length=50, help_text="Marca do produto")
    
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de custo pago ao fornecedor")
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Margem desejada em %")
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de venda para o cliente")
    
    
    stock_quantity = models.IntegerField(default=0, help_text="Quantidade atual no estoque")
    min_stock_quantity = models.IntegerField(default=5, help_text="Estoque mínimo para alerta de reposição")
    location = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        help_text="Localização física na oficina (ex: Corredor A, Prateleira 3)"
    )
    
    is_active = models.BooleanField(default=True, help_text="Produto ativo para novas vendas")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)