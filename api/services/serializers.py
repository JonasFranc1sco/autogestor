from rest_framework import serializers
from .models import Service
from employees.serializers import EmployeeSerializer
from employees.models import Employee

class ServiceSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), write_only=True, source="employee", required=False, allow_null=True
    )

    class Meta:
        model = Service
        fields = [
            "id", "name", "description", "employee", "employee_id",
            "cost_price", "margin_percentage", "sale_price",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
