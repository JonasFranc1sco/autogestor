from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'name', 'phone','email','address','document_cpf', 'document_rg', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']