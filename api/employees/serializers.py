from rest_framework import serializers
from .models import Employee
from core.serializers import NestedAddressModelSerializer


class EmployeeSerializer(NestedAddressModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'name', 'phone', 'email', 'address', 'document_cpf', 'document_rg', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def _validate_unique(self, value, field, label):
        if not value:
            return value

        queryset = Employee.objects.filter(**{field: value, "is_active": True})
        request = self.context.get("request")
        workshop = None
        if request is not None and request.user.is_authenticated:
            from core.tenancy import tenant_of
            workshop = tenant_of(request.user)
        if workshop is not None:
            queryset = queryset.filter(workshop=workshop)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                f"Já existe um funcionário ativo com este {label}."
            )
        return value

    def validate_document_cpf(self, value):
        return self._validate_unique(value, "document_cpf", "CPF")

    def validate_document_rg(self, value):
        return self._validate_unique(value, "document_rg", "RG")
