from django.contrib.auth import authenticate
from rest_framework import serializers

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