from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from rest_framework.response import Response

from rest_framework import status
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken, BlacklistedToken,
)

from users.models import User
from users.serializers.password import (
    PasswordChangeSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
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
        

class PasswordResetView(APIView):
    """Solicitação de recuperação de senha. Sempre responde 200 (não enumera usuários)."""

    authentication_classes = []
    permission_classes = []

    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"], is_active=True
        ).first()

        if user is not None:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            base_url = settings.PASSWORD_RESET_URL
            link = f"{base_url}?uid={uid}&token={token}"

            send_mail(
                "Autogestor — Recuperação de senha",
                f"Olá, {user.full_name}.\n\n"
                f"Use o link abaixo para redefinir sua senha (válido por 24h):\n{link}\n\n"
                f"Se você não solicitou, ignore este e-mail.",
                None,
                [user.email],
                fail_silently=True,
            )

        return Response(
            {"detail": "Se o e-mail existir, o link de recuperação será enviado."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = []

    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = urlsafe_base64_decode(serializer.validated_data["uid"]).decode()
            user = User.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist, UnicodeDecodeError):
            return Response(
                {"detail": "Link de recuperação inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response(
                {"detail": "Link de recuperação inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)

        return Response({"detail": "Senha redefinida com sucesso."}, status=status.HTTP_200_OK)
