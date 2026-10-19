from django.shortcuts import render
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated
from users.models import User, Role
from users.permissions import IsAdmin, IsManagerOrAdmin, IsOwnerOrAdmin
from users.serializers.user import UserUpdateSerializer, UserCreateSerializer, UserListSerializer, UserDetailSerializer
from core.tenancy import scope_queryset
# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter]
    search_fields = ["full_name", "email"]

    def get_queryset(self): #type: ignore
        queryset = scope_queryset(self.request.user, User.objects.all())

        return queryset.filter(is_active=True).order_by("full_name")
    
    
    def get_serializer_class(self): #type: ignore
        
        if self.action == "create":
            return UserCreateSerializer
        
        if self.action == "list":
            return UserListSerializer

        if self.action == "retrieve":
            return UserDetailSerializer
        
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        
        return UserUpdateSerializer
        
    def perform_create(self, serializer):
        serializer.save(workshop=self.request.user.workshop)
        
    def perform_update(self, serializer):
        serializer.save()
        
    def perform_destroy(self, instance):
        from rest_framework.exceptions import ValidationError

        if instance == self.request.user:
            raise ValidationError("Você não pode desativar a própria conta.")

        if instance.role == Role.ADMIN:
            other_admins = User.objects.filter(
                workshop=instance.workshop, role=Role.ADMIN, is_active=True
            ).exclude(pk=instance.pk)
            if not other_admins.exists():
                raise ValidationError("Não é possível desativar o último administrador da oficina.")

        instance.is_active = False

        instance.save(update_fields=["is_active", "updated_at"])
        
    def get_permissions(self):
        
        if self.action == "create":
            permissions = [IsAdmin]
        
        elif self.action == "destroy":
            permissions = [IsAdmin]
            
        elif self.action == "list":
            permissions= [IsManagerOrAdmin]

        elif self.action in (
            "retrieve",
            "update",
            "partial_update",
        ):
            permissions = [IsOwnerOrAdmin]

        else:
            permissions = [IsAuthenticated]
            
        return [permission() for permission in permissions]