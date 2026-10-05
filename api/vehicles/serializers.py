from rest_framework import serializers
from .models import Vehicle
from clients.models import Client
from clients.serializers import ClientSerializer

class VehicleSerializer(serializers.ModelSerializer):
    owner = ClientSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), write_only=True, source='owner'
    )
    class Meta:
        model = Vehicle
        fields = ['id', 'owner','owner_id', 'license_plate','brand','model','color', 'chassis', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']