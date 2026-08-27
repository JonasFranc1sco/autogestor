from rest_framework import viewsets
from django.shortcuts import render
from .models import Vehicle
from .serializers import VehicleSerializer
from users.permissions import CanManageVehicles

# Create your views here.
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    
    permission_classes = [CanManageVehicles]