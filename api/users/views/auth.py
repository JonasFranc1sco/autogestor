from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from users.serializers.auth import LoginSerializer
from users.services.auth_service import AuthService
from rest_framework.permissions import IsAuthenticated
        
class LoginView(APIView):
    authentication_classes = []
    
    permission_classes = []
    
    def post(self, request):
        
        serializer = LoginSerializer(
            data=request.data
        )
        
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data["user"] # type: ignore
        
        tokens = AuthService.generate_tokens(user)
        
        response = Response(
            {
                "access": tokens["access"],
            },
            status=status.HTTP_200_OK
        )
        
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh"],
            httponly=True,
        )
        
        return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        
        refresh_token = request.data.get("refresh")
        
        if not refresh_token:
            return Response(
                {
                    "detail": "Refresh token é obrigatório."
                },
                status=400
            )
            
        success = AuthService.logout(request.user, refresh_token)
        
        
        if not success:
            
            return Response(
                {
                    "detail": "Refresh token inválido."
                },
                status=400
            )
            
        return Response(status=205)