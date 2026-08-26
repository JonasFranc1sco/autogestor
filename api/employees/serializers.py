from rest_framework import serializers
from .models import Employee
from core.serializers import AddressSerializer

class EmployeeSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    class Meta:
        model = Employee
        fields = ['id', 'name', 'phone','email','address','document_cpf', 'document_rg', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']