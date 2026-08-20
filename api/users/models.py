from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from core.models import BaseModel
from users.managers import UserManager
    
# User Model
class Role(models.TextChoices):
    ADMIN = "ADMIN", "Administrador"
    MANAGER = "MANAGER", "Gerente"
    MECHANIC = "MECHANIC", "Mecânico"
    ATTENDANT = "ATTENDANT", "Atendente"

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True, max_length=255)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ATTENDANT)
    is_staff = models.BooleanField(default=False)
    
    objects: UserManager = UserManager() # type: ignore[assignment]
    
    USERNAME_FIELD = 'email'
    
    REQUIRED_FIELDS = ['full_name']
    
    class Meta(BaseModel.Meta):
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.email