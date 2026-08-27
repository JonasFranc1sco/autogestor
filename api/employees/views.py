from rest_framework import viewsets
from django.shortcuts import render
from .models import Employee
from .serializers import EmployeeSerializer
from users.permissions import CanManageEmployees
# Create your views here.
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    
    permission_classes = [CanManageEmployees]