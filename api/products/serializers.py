from rest_framework import serializers
from .models import Product

class ProductsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'reference_code', 'barcode', 'description', 'supplier', 'brand',
                  'cost_price', 'margin_percentage', 'sale_price', 'stock_quantity', 'min_stock_quantity',
                  'location', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']