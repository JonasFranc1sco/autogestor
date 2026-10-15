from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from core.models import Workshop
from core.serializers import WorkshopSerializer
from users.permissions import IsManagerOrAdmin
from core.tenancy import tenant_of


class WorkshopView(generics.RetrieveUpdateAPIView):
    """Dados da oficina do usuário autenticado."""

    serializer_class = WorkshopSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def get_object(self):
        workshop = tenant_of(self.request.user)
        if workshop is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Usuário da plataforma não possui oficina associada.")
        return workshop
