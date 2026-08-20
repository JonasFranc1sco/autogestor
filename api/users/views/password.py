from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from rest_framework.response import Response

from rest_framework import status

from users.serializers.password import (
    PasswordChangeSerializer
)
from users.services.password_service import PasswordService

class ChangePasswordView(APIView):
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request}
        )
        
        serializer.is_valid(
            raise_exception=True
        )
        
        try:
            PasswordService.change_password(
                user=request.user,
                current_password=serializer.validated_data["current_password"], new_password=serializer.validated_data["new_password"]) #type: ignore
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return Response(
            {"detail": "Senha alterada com sucesso."},
            status=status.HTTP_200_OK
        )
        