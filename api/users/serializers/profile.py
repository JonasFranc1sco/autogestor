from rest_framework import serializers

from users.models import User

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        
        fields = ["id", "full_name", "role","email", "created_at", "is_active"]

        read_only_fields = ["id", "role", "email", "created_at", "is_active"]

class ProfileUpdateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        
        fields = ["full_name"]