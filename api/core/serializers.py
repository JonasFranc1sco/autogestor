from rest_framework import serializers
from .models import Address, Workshop


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'complement']


class NestedAddressModelSerializer(serializers.ModelSerializer):
    """Serializer com endereço aninhado opcional, compartilhado por Client/Employee/Workshop."""

    address = AddressSerializer(required=False, allow_null=True)

    def _save_address(self, instance, address_data):
        if not address_data:
            return instance

        if instance.address_id:
            address = instance.address
            for attr, value in address_data.items():
                setattr(address, attr, value)
            address.save()
        else:
            instance.address = Address.objects.create(**address_data)
            instance.save(update_fields=["address"])
        return instance

    def create(self, validated_data):
        address_data = validated_data.pop("address", None)
        instance = super().create(validated_data)
        return self._save_address(instance, address_data)

    def update(self, instance, validated_data):
        address_data = validated_data.pop("address", None)
        instance = super().update(instance, validated_data)
        return self._save_address(instance, address_data)


class WorkshopSerializer(NestedAddressModelSerializer):

    class Meta:
        model = Workshop
        fields = [
            'id', 'name', 'cnpj', 'phone', 'email', 'address',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_cnpj(self, value):
        if not value:
            return value

        queryset = Workshop.objects.filter(cnpj=value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Já existe uma oficina com este CNPJ."
            )
        return value
