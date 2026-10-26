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

class CanManageServices(BasePermission):
    """Catálogo de serviços: leitura para todos os papéis, escrita para admin/gerente."""

    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.role in [Role.ADMIN, Role.MANAGER]


class CanManageServiceOrders(BasePermission):
    """Ordens de serviço.

    Criação: atendimento e gestão (mecânico não cria OS com preços).
    Atualização: gestão, atendimento e mecânico (o ViewSet restringe os
    campos que o mecânico pode alterar).
    Exclusão: apenas admin/gerente.
    """

    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if request.method == "POST":
            # Transição de status é permitida ao mecânico; criação de OS não.
            if getattr(view, "action", None) == "change_status":
                return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT, Role.MECHANIC]
            return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]

        if request.method == "DELETE":
            return request.user.role in [Role.ADMIN, Role.MANAGER]

        return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT, Role.MECHANIC]


class CanManageStock(BasePermission):
    """Movimentação de estoque: escrita apenas para admin/gerente."""

    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.role in [Role.ADMIN, Role.MANAGER]


class CanManageAppointments(BasePermission):
    """Agendamentos: criação/edição para atendimento e gestão; transição de status também para mecânico."""

    def has_permission(self, request, view): # type: ignore
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if request.method == "POST":
            if getattr(view, "action", None) == "change_status":
                return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT, Role.MECHANIC]
            return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]

        if request.method == "DELETE":
            return request.user.role in [Role.ADMIN, Role.MANAGER]

        return request.user.role in [Role.ADMIN, Role.MANAGER, Role.ATTENDANT]
