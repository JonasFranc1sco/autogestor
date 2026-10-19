from django.core.exceptions import ImproperlyConfigured  # noqa: F401
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Workshop
from users.models import User, Role

REST_FRAMEWORK_NO_THROTTLE = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {"auth": "1000/min", "register": "1000/min"},
}


class BaseAuthTestCase(APITestCase):
    def setUp(self):
        self.workshop = Workshop.objects.create(name="Oficina do Zé")
        self.admin = User.objects.create_user(
            email="admin@oficina.com",
            password="senhaForte123",
            full_name="Zé Admin",
            role=Role.ADMIN,
            workshop=self.workshop,
        )


@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_NO_THROTTLE)
class RegisterTests(APITestCase):
    def test_register_creates_workshop_and_admin(self):
        payload = {
            "workshop": {"name": "Oficina Nova", "cnpj": "12.345.678/0001-90"},
            "full_name": "Maria Dona",
            "email": "maria@oficinanova.com",
            "password": "senhaForte123",
        }

        response = self.client.post("/api/auth/register/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)

        user = User.objects.get(email="maria@oficinanova.com")
        self.assertEqual(user.role, Role.ADMIN)
        self.assertEqual(user.workshop.name, "Oficina Nova")

        workshop = Workshop.objects.get(name="Oficina Nova")
        self.assertEqual(workshop.cnpj, "12.345.678/0001-90")

        self.assertIn("refresh_token", response.cookies)
        self.assertTrue(response.cookies["refresh_token"]["httponly"])

    def test_register_rejects_weak_password(self):
        payload = {
            "workshop": {"name": "Oficina Nova"},
            "full_name": "Maria Dona",
            "email": "maria@oficinanova.com",
            "password": "123",
        }

        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_duplicated_email(self):
        workshop = Workshop.objects.create(name="Oficina Existente")
        User.objects.create_user(
            email="existe@teste.com",
            password="senhaForte123",
            full_name="Existente",
            workshop=workshop,
        )
        payload = {
            "workshop": {"name": "Outra Oficina"},
            "full_name": "Novo",
            "email": "existe@teste.com",
            "password": "senhaForte123",
        }

        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_NO_THROTTLE)
class LoginRefreshLogoutTests(BaseAuthTestCase):
    def test_login_sets_refresh_cookie_and_returns_access(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "admin@oficina.com", "password": "senhaForte123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        cookie = response.cookies["refresh_token"]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["path"], "/api/")

    def test_login_with_wrong_password_fails(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "admin@oficina.com", "password": "errada"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_rotates_cookie_and_returns_access(self):
        login = self.client.post(
            "/api/auth/login/",
            {"email": "admin@oficina.com", "password": "senhaForte123"},
            format="json",
        )
        self.client.cookies = login.cookies

        response = self.client.post("/api/auth/refresh/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh_token", response.cookies)

    def test_refresh_without_cookie_fails(self):
        response = self.client.post("/api/auth/refresh/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_token_and_clears_cookie(self):
        login = self.client.post(
            "/api/auth/login/",
            {"email": "admin@oficina.com", "password": "senhaForte123"},
            format="json",
        )
        self.client.cookies = login.cookies

        response = self.client.post(
            "/api/auth/logout/",
            HTTP_AUTHORIZATION=f"Bearer {login.data['access']}",
        )
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertEqual(response.cookies["refresh_token"].value, "")

        refresh = self.client.post("/api/auth/refresh/")
        self.assertEqual(refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_NO_THROTTLE)
class UserManagementTests(BaseAuthTestCase):
    def test_create_user_with_weak_password_rejected(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            "/api/users/",
            {"full_name": "Novo", "email": "novo@teste.com", "password": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_creates_user_with_role(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            "/api/users/",
            {
                "full_name": "Mecânico Novo",
                "email": "mecanico@teste.com",
                "password": "senhaForte123",
                "role": Role.MECHANIC,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email="mecanico@teste.com")
        self.assertEqual(user.role, Role.MECHANIC)
        self.assertEqual(user.workshop, self.workshop)

    def test_attendant_cannot_set_role(self):
        attendant = User.objects.create_user(
            email="atendente@teste.com",
            password="senhaForte123",
            full_name="Atendente",
            role=Role.ATTENDANT,
            workshop=self.workshop,
        )
        self.client.force_authenticate(attendant)

        response = self.client.post(
            "/api/users/",
            {
                "full_name": "Outro",
                "email": "outro@teste.com",
                "password": "senhaForte123",
                "role": Role.ADMIN,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_list_is_scoped_by_workshop(self):
        other_workshop = Workshop.objects.create(name="Outra Oficina")
        User.objects.create_user(
            email="fora@teste.com",
            password="senhaForte123",
            full_name="Fora",
            workshop=other_workshop,
        )
        User.objects.create_user(
            email="dentro@teste.com",
            password="senhaForte123",
            full_name="Dentro",
            workshop=self.workshop,
        )

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = {item["email"] for item in response.data["results"]}
        self.assertIn("admin@oficina.com", emails)
        self.assertIn("dentro@teste.com", emails)
        self.assertNotIn("fora@teste.com", emails)

    def test_soft_deleted_user_hidden_from_list(self):
        inactive = User.objects.create_user(
            email="inativo@teste.com",
            password="senhaForte123",
            full_name="Inativo",
            workshop=self.workshop,
        )
        inactive.is_active = False
        inactive.save(update_fields=["is_active"])

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/users/")

        emails = {item["email"] for item in response.data["results"]}
        self.assertNotIn("inativo@teste.com", emails)

    def test_user_without_workshop_sees_nothing(self):
        from rest_framework.test import APIClient
        from clients.models import Client

        Client.objects.create(workshop=self.workshop, name="Cliente A", document="12345678901")
        nomad = User.objects.create_user(
            email="semoficina@teste.com",
            password="senhaForte123",
            full_name="Sem Oficina",
            role=Role.ADMIN,
            workshop=None,
        )

        self.client.force_authenticate(nomad)
        response = self.client.get("/api/clients/")
        self.assertEqual(response.data["count"], 0)

        response = self.client.get("/api/users/")
        self.assertEqual(response.data["count"], 0)

    def test_register_rejects_duplicated_cnpj(self):
        Workshop.objects.create(name="Oficina Existente", cnpj="11.222.333/0001-44")
        payload = {
            "workshop": {"name": "Outra Oficina", "cnpj": "11.222.333/0001-44"},
            "full_name": "Novo",
            "email": "novo@teste.com",
            "password": "senhaForte123",
        }

        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_workshop_endpoint(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/workshop/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Oficina do Zé")

    def test_profile_returns_workshop(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["workshop"]["name"], "Oficina do Zé")
        
    def test_admin_can_deactivate_another_user(self):
        target = User.objects.create_user(
            email="mecanico@oficina.com",
            password="senhaForte123",
            full_name="Mecânico Alvo",
            role=Role.MECHANIC,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.delete(f"/api/users/{target.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        target.refresh_from_db()
        self.assertFalse(target.is_active)

    def test_admin_can_deactivate_second_admin(self):
        second_admin = User.objects.create_user(
            email="admin2@oficina.com",
            password="senhaForte123",
            full_name="Segundo Admin",
            role=Role.ADMIN,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.delete(f"/api/users/{second_admin.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        second_admin.refresh_from_db()
        self.assertFalse(second_admin.is_active)

    def test_admin_cannot_deactivate_self(self):
        self.client.force_authenticate(self.admin)

        response = self.client.delete(f"/api/users/{self.admin.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_cannot_deactivate_last_admin_of_workshop(self):
        platform_superuser = User.objects.create_superuser(
            email="root@autogestor.com",
           password="senhaForte123",
            full_name="Super Admin Plataforma",
            role=Role.ADMIN,
            workshop=None,
        )
        self.client.force_authenticate(platform_superuser)

        response = self.client.delete(f"/api/users/{self.admin.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)
    
    def test_last_admin_cannot_demote_self(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/users/{self.admin.id}/",
            {"full_name": self.admin.full_name, "role": Role.MANAGER},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, Role.ADMIN)

    def test_last_admin_can_still_update_own_name_keeping_admin_role(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/users/{self.admin.id}/",
            {"full_name": "Zé Admin Atualizado", "role": Role.ADMIN},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.full_name, "Zé Admin Atualizado")
        self.assertEqual(self.admin.role, Role.ADMIN)

    def test_admin_can_demote_second_admin_when_another_active_admin_exists(self):
        second_admin = User.objects.create_user(
            email="admin2@oficina.com",
            password="senhaForte123",
            full_name="Segundo Admin",
            role=Role.ADMIN,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/users/{second_admin.id}/",
            {"full_name": second_admin.full_name, "role": Role.MANAGER},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        second_admin.refresh_from_db()
        self.assertEqual(second_admin.role, Role.MANAGER)


@override_settings(REST_FRAMEWORK=REST_FRAMEWORK_NO_THROTTLE)
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.workshop = Workshop.objects.create(name="Oficina A")
        self.user = User.objects.create_user(
            email="reset@teste.com",
            password="senhaForte123",
            full_name="Reset",
            role=Role.ATTENDANT,
            workshop=self.workshop,
        )

    def test_request_reset_returns_200_even_for_unknown_email(self):
        response = self.client.post(
            "/api/auth/password-reset/", {"email": "naoexiste@teste.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            "/api/auth/password-reset/", {"email": "reset@teste.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reset_confirm_with_valid_token(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "new_password": "novaSenhaForte123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("novaSenhaForte123"))

    def test_reset_confirm_with_invalid_token(self):
        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": "abc", "token": "errado", "new_password": "novaSenhaForte123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_confirm_rejects_weak_password(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "new_password": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class AuthThrottleSecurityTests(BaseAuthTestCase):
    def setUp(self):
        super().setUp()
        from django.core.cache import cache
        cache.clear()

    def tearDown(self):
        from django.core.cache import cache
        cache.clear()
        super().tearDown()

    def test_spoofed_xff_cannot_bypass_login_throttle_when_num_proxies_zero(self):
        from unittest.mock import patch
        from rest_framework.throttling import SimpleRateThrottle

        throttled_settings = {
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": (
                "rest_framework.permissions.IsAuthenticated",
            ),
            "DEFAULT_THROTTLE_CLASSES": [
                "rest_framework.throttling.ScopedRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {"auth": "2/min", "register": "2/min"},
            "NUM_PROXIES": 0,
        }

        with (
            override_settings(REST_FRAMEWORK=throttled_settings),
            patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"auth": "2/min"}),
        ):
            for spoofed_ip in ("10.0.0.1", "10.0.0.2"):
                res = self.client.post(
                    "/api/auth/login/",
                    {"email": "admin@oficina.com", "password": "errada"},
                    format="json",
                    HTTP_X_FORWARDED_FOR=spoofed_ip,
                )
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

            # 3ª tentativa com outro X-Forwarded-For forjado deve ser bloqueada (429)
            blocked = self.client.post(
                "/api/auth/login/",
                {"email": "admin@oficina.com", "password": "errada"},
                format="json",
                HTTP_X_FORWARDED_FOR="10.0.0.3",
            )
            self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_proxy_xff_isolates_clients_and_blocks_header_spoofing(self):
        from unittest.mock import patch
        from rest_framework.throttling import SimpleRateThrottle

        throttled_settings = {
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": (
                "rest_framework.permissions.IsAuthenticated",
            ),
            "DEFAULT_THROTTLE_CLASSES": [
                "rest_framework.throttling.ScopedRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {"auth": "2/min", "register": "2/min"},
            "NUM_PROXIES": 1,
        }

        with (
            override_settings(REST_FRAMEWORK=throttled_settings),
            patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"auth": "2/min"}),
        ):
            # Atacante (IP real 203.0.113.10 adicionado pelo Nginx ao final do XFF)
            for fake_prefix in ("1.1.1.1", "2.2.2.2"):
                res = self.client.post(
                    "/api/auth/login/",
                    {"email": "admin@oficina.com", "password": "errada"},
                    format="json",
                    HTTP_X_FORWARDED_FOR=f"{fake_prefix}, 203.0.113.10",
                )
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

            blocked = self.client.post(
                "/api/auth/login/",
                {"email": "admin@oficina.com", "password": "errada"},
                format="json",
                HTTP_X_FORWARDED_FOR="3.3.3.3, 203.0.113.10",
            )
            self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

            # Outro cliente legítimo (IP real 198.51.100.25) não é afetado pelo bloqueio
            legit = self.client.post(
                "/api/auth/login/",
                {"email": "admin@oficina.com", "password": "senhaForte123"},
                format="json",
                HTTP_X_FORWARDED_FOR="198.51.100.25",
            )
            self.assertEqual(legit.status_code, status.HTTP_200_OK)