from rest_framework import viewsets
from django.shortcuts import render
from .models import Client
from .serializers import ClientSerializer
from users.permissions import CanManageClients
# Create your views here.
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    permission_classes = [CanManageClients]