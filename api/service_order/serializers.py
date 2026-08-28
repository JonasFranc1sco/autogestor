from rest_framework import serializers
from .models import ServiceOrder
from clients.serializers import ClientSerializer
from vehicles.serializers import VehicleSerializer
from employees.serializers import EmployeeSerializer


class ServiceOrderSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    mechanic = EmployeeSerializer(read_only=True)

    client_id = serializers.UUIDField(write_only=True)
    vehicle_id = serializers.UUIDField(write_only=True)
    mechanic_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ServiceOrder
        fields = [
            "id", "client", "vehicle", "mechanic",
            "client_id", "vehicle_id", "mechanic_id",
            "status", "description", "observations",
            "total_price", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
