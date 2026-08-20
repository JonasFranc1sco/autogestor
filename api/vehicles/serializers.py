from rest_framework import serializers
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'owner', 'license_plate','brand','model','color', 'chassis', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']