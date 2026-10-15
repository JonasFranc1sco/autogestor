from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/"
REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # mesmo tempo de vida do refresh token


class AuthService:

    @staticmethod
    def generate_tokens(user):

        refresh = RefreshToken.for_user(user)

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

    @staticmethod
    def set_refresh_cookie(response, token):
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=token,
            max_age=REFRESH_COOKIE_MAX_AGE,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            path=REFRESH_COOKIE_PATH,
        )

    @staticmethod
    def clear_refresh_cookie(response):
        response.delete_cookie(
            key=REFRESH_COOKIE_NAME,
            path=REFRESH_COOKIE_PATH,
        )
