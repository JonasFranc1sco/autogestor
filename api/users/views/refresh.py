from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

class RefreshView(APIView):
    
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        
        refresh = request.COOKIES.get("refresh_token")
        
        if not refresh:
            return Response(
                {"detail": "Refresh token não encontrado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            
        serializer = TokenRefreshSerializer(
            data={"refresh": refresh}
        )
        
        serializer.is_valid(raise_exception=True)
        
        response = Response(
            {
                "access": serializer.validated_data["access"], # type: ignore
            },
            status=status.HTTP_200_OK,
        )
        
        response.set_cookie(
            key="refresh_token",
            value=serializer.validated_data["refresh"], #type: ignore
            httponly=True,
        )
        
        return response
    