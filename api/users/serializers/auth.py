from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from core.models import Workshop
from core.serializers import AddressSerializer, WorkshopSerializer
from users.models import User, Role


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            username=email,
            password=password
        )

        if user is None:
            raise serializers.ValidationError(
                "Email ou senha inválidos."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "Usuário desativado."
            )

        attrs["user"] = user

        return attrs


class RegisterSerializer(serializers.Serializer):
    """Cadastro de uma nova oficina com o usuário administrador (owner)."""

    workshop = WorkshopSerializer()
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Já existe um usuário com este email."
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        from core.models import Address

        workshop_data = validated_data.pop("workshop")
        address_data = workshop_data.pop("address", None)

        if address_data:
            workshop_data["address"] = Address.objects.create(**address_data)

        workshop = Workshop.objects.create(**workshop_data)

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            role=Role.ADMIN,
            workshop=workshop,
        )

        return user
