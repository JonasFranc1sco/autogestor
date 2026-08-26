from rest_framework import viewsets
from django.shortcuts import render
from .models import Client
from .serializers import ClientSerializer
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsOwnerOrAdmin
# Create your views here.
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]