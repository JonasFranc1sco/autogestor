from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.models import User
from users.permissions import IsAdmin, IsManager, IsOwnerOrAdmin
from users.serializers.user import UserUpdateSerializer, UserCreateSerializer, UserListSerializer, UserDetailSerializer
# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    
    def get_queryset(self): #type: ignore
        queryset = User.objects.all()
        
        return queryset.order_by("full_name")
    
    
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
        serializer.save()
        
    def perform_update(self, serializer):
        serializer.save()
        
    def perform_destroy(self, instance):
        
        instance.is_active = False
        
        instance.save()
        
    def get_permissions(self):
        
        if self.action == "create":
            permissions = [IsAdmin]
        
        elif self.action == "destroy":
            permissions = [IsAdmin]
            
        elif self.action == "list":
            permissions= [IsManager]

        elif self.action in (
            "retrieve",
            "update",
            "partial_update",
        ):
            permissions = [IsOwnerOrAdmin]

        else:
            permissions = [IsAuthenticated]
            
        return [permission() for permission in permissions]