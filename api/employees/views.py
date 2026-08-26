from rest_framework import viewsets
from django.shortcuts import render
from .models import Employee
from .serializers import EmployeeSerializer
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsOwnerOrAdmin
# Create your views here.
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]