from rest_framework import serializers
from .models import Vehicle
from clients.serializers import ClientSerializer

class VehicleSerializer(serializers.ModelSerializer):
    owner = ClientSerializer(read_only=True)
    class Meta:
        model = Vehicle
        fields = ['id', 'owner', 'license_plate','brand','model','color', 'chassis', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']