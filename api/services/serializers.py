from rest_framework import serializers
from .models import Service
from employees.serializers import EmployeeSerializer
from employees.models import Employee
from core.tenancy import TenantPrimaryKeyRelatedField, tenant_of
from users.models import Role

HIDDEN_COST_FIELDS = ("cost_price", "margin_percentage")


class ServiceSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    employee_id = TenantPrimaryKeyRelatedField(
        queryset=Employee.objects.all(), write_only=True, source="employee", required=False, allow_null=True
    )

    class Meta:
        model = Service
        fields = [
            "id", "name", "description", "employee", "employee_id",
            "cost_price", "margin_percentage", "sale_price", "warranty_days",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_name(self, value):
        queryset = Service.objects.filter(name=value, is_active=True)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            workshop = tenant_of(request.user)
            if workshop is not None:
                queryset = queryset.filter(workshop=workshop)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Já existe um serviço ativo com este nome."
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            if request.user.role not in (Role.ADMIN, Role.MANAGER) and not request.user.is_superuser:
                for field in HIDDEN_COST_FIELDS:
                    data.pop(field, None)
        return data
