from django.db import models
from core.models import BaseModel
from employees.models import Employee
# Create your models here.

class Service(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=5, decimal_places=2)
    
    def __str__(self):
        return self.name