from rest_framework.permissions import BasePermission
from users.models import Role

class IsAdmin(BasePermission):
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )
        
class IsManager(BasePermission):
    
    def has_permission(self, request, view): #type: ignore[override]
        return (
            request.user.is_authenticated
            and request.user.role in [
                Role.ADMIN,
                Role.MANAGER,
            ]
        )
        
class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        
        return obj == request.user