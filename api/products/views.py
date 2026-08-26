from rest_framework import viewsets
from django.shortcuts import render
from .models import Product
from .serializers import ProductsSerializer
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsOwnerOrAdmin

# Create your views here.

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductsSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]