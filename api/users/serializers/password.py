from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

class PasswordChangeSerializer(serializers.Serializer):
    
    current_password = serializers.CharField()
    
    new_password = serializers.CharField()
    
    confirm_password = serializers.CharField()
    
    def validate(self, attrs):
        
        if attrs["new_password"] != attrs["confirm_password"]:
            
            raise serializers.ValidationError(
                {
                    "confirm_password":
                    "As senhas não coincidem."
                }
            )
            
        validate_password(attrs["new_password"], self.context["request"].user,)
        
        return attrs