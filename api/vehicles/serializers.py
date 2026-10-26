import re

from rest_framework import serializers
from .models import Vehicle
from clients.models import Client
from clients.serializers import ClientSerializer
from core.tenancy import TenantPrimaryKeyRelatedField, tenant_of

LICENSE_PLATE_REGEX = re.compile(r"^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$")


class VehicleSerializer(serializers.ModelSerializer):
    owner = ClientSerializer(read_only=True)
    owner_id = TenantPrimaryKeyRelatedField(
        queryset=Client.objects.filter(is_active=True), write_only=True, source='owner'
    )
    license_plate = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=8
    )

    class Meta:
        model = Vehicle
        fields = ['id', 'owner', 'owner_id', 'license_plate', 'mileage', 'year', 'brand', 'model', 'color', 'chassis', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_license_plate(self, value):
        if not value:
            return None

        value = value.upper().replace("-", "").replace(" ", "")

        if not LICENSE_PLATE_REGEX.match(value):
            raise serializers.ValidationError(
                "Placa deve estar no formato ABC1234 (antiga) ou ABC1D23 (Mercosul)."
            )

        queryset = Vehicle.objects.filter(license_plate=value, is_active=True)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            workshop = tenant_of(request.user)
            if workshop is not None:
                queryset = queryset.filter(workshop=workshop)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Já existe um veículo ativo com esta placa."
            )
        return value
