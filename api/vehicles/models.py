from django.db import models
from clients.models import Client
from core.models import BaseModel

# Create your models here.
class Vehicle(BaseModel):
    owner = models.ForeignKey(Client, on_delete=models.CASCADE)
    license_plate = models.CharField(max_length=7)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=155)
    color = models.CharField(max_length=50)
    chassis = models.CharField(max_length=155)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)