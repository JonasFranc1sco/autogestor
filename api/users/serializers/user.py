from rest_framework.serializers import ModelSerializer
from users.models import User, Role
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
    
class UserListSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', "role", 'full_name', 'email', 'is_active']
        
class UserDetailSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', "role", 'full_name', 'email', 'workshop', 'created_at', 'is_active', 'last_login']
        
class UserCreateSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'password', 'created_at', 'is_active']
        read_only_fields = ['created_at', 'is_active', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_role(self, value):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user.role != Role.ADMIN and not request.user.is_superuser:
                raise serializers.ValidationError(
                    "Apenas administradores podem definir o papel do usuário."
                )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user
        
class UserUpdateSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "role"]
        
    def validate_role(self, value):
        request = self.context.get("request")
        
        if not request:
            raise serializers.ValidationError(
                "Request context is required."
            )
            
        if request.user.role != Role.ADMIN:
            raise serializers.ValidationError(
                "Only administrators can change users roles."
            )
            
        return value
