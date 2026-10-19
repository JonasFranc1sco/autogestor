from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle

from users.serializers.auth import LoginSerializer, RegisterSerializer
from users.services.auth_service import AuthService, REFRESH_COOKIE_NAME


class LoginView(APIView):
    authentication_classes = []

    permission_classes = []

    throttle_scope = "auth"

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

        AuthService.set_refresh_cookie(response, tokens["refresh"])

        return response


class RegisterView(APIView):
    """Cadastro de uma nova oficina com o usuário administrador."""

    authentication_classes = []

    permission_classes = []

    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        tokens = AuthService.generate_tokens(user)

        response = Response(
            {
                "access": tokens["access"],
            },
            status=status.HTTP_201_CREATED
        )

        AuthService.set_refresh_cookie(response, tokens["refresh"])

        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME) or request.data.get("refresh")

        if not refresh_token:
            response = Response(
                {
                    "detail": "Refresh token é obrigatório."
                },
                status=400
            )
            AuthService.clear_refresh_cookie(response)
            return response

        success = AuthService.logout(request.user, refresh_token)

        if not success:
            response = Response(
                {
                    "detail": "Refresh token inválido."
                },
                status=400
            )
            AuthService.clear_refresh_cookie(response)
            return response

        response = Response(status=205)
        AuthService.clear_refresh_cookie(response)
        return response
