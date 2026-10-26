from rest_framework import serializers
from .models import Address, Workshop
from .validators import is_valid_cnpj, normalize_digits


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
        address_provided = "address" in validated_data
        address_data = validated_data.pop("address", None)
        instance = super().update(instance, validated_data)

        if address_provided and address_data is None:
            if instance.address_id:
                instance.address.delete()
                instance.address = None
                instance.save(update_fields=["address"])
            return instance

        return self._save_address(instance, address_data)


class WorkshopSerializer(NestedAddressModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Workshop
        fields = [
            'id', 'name', 'cnpj', 'phone', 'email', 'logo_url', 'address',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'logo_url', 'created_at', 'updated_at']

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url

    def validate_cnpj(self, value):
        if not value:
            return None

        digits = normalize_digits(value)
        if not digits:
            return None

        if not is_valid_cnpj(digits):
            raise serializers.ValidationError(
                "Informe um CNPJ válido (dígitos verificadores inválidos)."
            )

        queryset = Workshop.objects.filter(cnpj=digits)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Já existe uma oficina com este CNPJ."
            )
        return digits


class WorkshopLogoSerializer(serializers.Serializer):
    logo = serializers.FileField()

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".svg"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

    def validate_logo(self, value):
        import os

        ext = os.path.splitext(value.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "Formato não permitido. Envie JPG, PNG ou SVG."
            )
        if value.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "A logo deve ter no máximo 5 MB."
            )
        return value
