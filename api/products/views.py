from rest_framework import viewsets
from django.shortcuts import render
from .models import Product
from .serializers import ProductsSerializer

from users.permissions import CanManageProducts

# Create your views here.

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductsSerializer
    permission_classes = [CanManageProducts]