"""Isolamento multi-tenant.

Toda consulta e criação de dados de negócio deve passar por estes helpers,
garantindo que cada oficina enxergue apenas os próprios registros.

O superusuário da plataforma (is_superuser sem oficina) tem acesso global.
"""
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied


def tenant_of(user):
    """Retorna a oficina do usuário ou None para o administrador da plataforma."""
    if user.is_superuser and getattr(user, "workshop_id", None) is None:
        return None
    return getattr(user, "workshop", None)


def scope_queryset(user, queryset):
    """Restringe um queryset aos registros da oficina do usuário.

    Usuário autenticado sem oficina não vê nada; apenas o superusuário da
    plataforma (sem oficina) tem acesso global.
    """
    workshop = getattr(user, "workshop", None)
    if workshop is not None:
        return queryset.filter(workshop=workshop)
    if user.is_superuser:
        return queryset
    return queryset.none()


class TenantPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """PrimaryKeyRelatedField cujo queryset respeita a oficina do usuário."""

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.context.get("request") if hasattr(self, "context") else None
        if request is None or not request.user.is_authenticated:
            return queryset.all()
        return scope_queryset(request.user, queryset)


class TenantViewSetMixin:
    """Aplica isolamento de oficina em ViewSets.

    Uso: declarar antes do ModelViewSet na herança e garantir que o model
    possua o campo ``workshop``.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_anonymous:
            return queryset.none()
        return scope_queryset(self.request.user, queryset)

    def perform_create(self, serializer):
        workshop = self.request.user.workshop
        if workshop is None:
            raise PermissionDenied(
                "Criação de dados de negócio exige uma oficina associada ao usuário."
            )
        serializer.save(workshop=workshop)
