from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import Role

class IsAdmin(BasePermission):
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )
        
class IsManagerOrAdmin(BasePermission):
    
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
    
class CanManageClients(BasePermission):
    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]
    
class CanManageProducts(BasePermission):
    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]
    

class CanManageVehicles(BasePermission):
    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]
    
    def has_object_permission(self, request, view, obj): # type: ignore
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]
    
class CanManageEmployees(BasePermission):
    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.role in [Role.ADMIN, Role.MANAGER]
    
    def has_object_permission(self, request, view, obj): # type: ignore
        if request.method in SAFE_METHODS:
            return True
        
        return request.user.role in [Role.ADMIN, Role.MANAGER]