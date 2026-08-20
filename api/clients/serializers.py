from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'person_type','name', 'phone','email','address','document', 'responsible', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']