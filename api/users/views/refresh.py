from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from users.services.auth_service import AuthService, REFRESH_COOKIE_NAME


class RefreshView(APIView):

    authentication_classes = []
    permission_classes = []

    # Refresh usa cookie httpOnly com token válido — não é força-bruta,
    # então não compartilha o limite do login (derrubaria sessões legítimas).

    def post(self, request):

        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if not refresh:
            return Response(
                {"detail": "Refresh token não encontrado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
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

            AuthService.set_refresh_cookie(response, serializer.validated_data["refresh"]) # type: ignore

            return response
        except TokenError:
            return Response(
                {"detail": "Token é inválido ou está na blacklist (Token is blacklisted)."},
                status=status.HTTP_401_UNAUTHORIZED
            )
