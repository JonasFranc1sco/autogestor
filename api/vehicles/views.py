from rest_framework import viewsets
from django.shortcuts import render
from .models import Vehicle
from .serializers import VehicleSerializer
# Create your views here.
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer