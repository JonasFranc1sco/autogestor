from rest_framework import serializers
from .models import Client
from core.serializers import NestedAddressModelSerializer
from core.validators import is_valid_cpf_cnpj


class ClientSerializer(NestedAddressModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'person_type', 'name', 'phone', 'email', 'address', 'document', 'responsible', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_document(self, value):
        if not value:
            return value

        if not is_valid_cpf_cnpj(value):
            raise serializers.ValidationError(
                "Informe um CPF ou CNPJ válido (dígitos verificadores inválidos)."
            )

        queryset = Client.objects.filter(document=value, is_active=True)
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
                "Já existe um cliente ativo com este documento."
            )
        return value
