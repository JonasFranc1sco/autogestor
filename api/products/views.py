from rest_framework import viewsets
from django.shortcuts import render
from .models import Product
from .serializers import ProductsSerializer

# Create your views here.

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product
    serializer_class = ProductsSerializer