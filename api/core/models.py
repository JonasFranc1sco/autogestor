import uuid
from django.db import models

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
     
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True