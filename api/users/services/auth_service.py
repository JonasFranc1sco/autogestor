from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from users.serializers.auth import LoginSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class AuthService:
    
    @staticmethod
    def generate_tokens(user):
        
        refresh = RefreshToken.for_user(user)
        
        refresh["user_id"] = str(user.id)
        refresh["email"] = user.email
        refresh["full_name"] = user.full_name
        refresh["role"] = user.role
        
        return {
            "access": str(refresh.access_token),
            
            "refresh": str(refresh)
        }
    @staticmethod
    def logout(user, refresh_token):
        try:
            token = RefreshToken(refresh_token)
            
            if str(token.get("user_id")) != str(user.id):
                return False
            
            token.blacklist()
            
            return True
        
        except TokenError:
            
            return False