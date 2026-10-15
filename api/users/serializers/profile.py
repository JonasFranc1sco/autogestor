from rest_framework import serializers

from core.serializers import WorkshopSerializer
from users.models import User

class ProfileSerializer(serializers.ModelSerializer):

    workshop = WorkshopSerializer(read_only=True)

    class Meta:
        model = User

        fields = ["id", "full_name", "role", "email", "workshop", "created_at", "is_active"]

        read_only_fields = ["id", "role", "email", "created_at", "is_active"]


class ProfileUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = ["full_name"]
