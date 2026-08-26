from rest_framework import serializers
from .models import Client
from core.serializers import AddressSerializer

class ClientSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    class Meta:
        model = Client
        fields = ['id', 'person_type','name', 'phone','email','address','document', 'responsible', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']