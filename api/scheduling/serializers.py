from rest_framework import serializers

from core.tenancy import TenantPrimaryKeyRelatedField
from .models import Appointment
from clients.models import Client
from clients.serializers import ClientSerializer
from vehicles.models import Vehicle
from vehicles.serializers import VehicleSerializer
from employees.models import Employee
from employees.serializers import EmployeeSerializer


class AppointmentSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    mechanic = EmployeeSerializer(read_only=True)

    client_id = TenantPrimaryKeyRelatedField(
        queryset=Client.objects.filter(is_active=True), write_only=True, source="client"
    )
    vehicle_id = TenantPrimaryKeyRelatedField(
        queryset=Vehicle.objects.filter(is_active=True), write_only=True, source="vehicle"
    )
    mechanic_id = TenantPrimaryKeyRelatedField(
        queryset=Employee.objects.filter(is_active=True), write_only=True, source="mechanic",
        required=False, allow_null=True,
    )

    class Meta:
        model = Appointment
        fields = [
            "id", "client", "vehicle", "mechanic",
            "client_id", "vehicle_id", "mechanic_id",
            "service_order", "scheduled_at", "expected_duration_minutes",
            "description", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "service_order", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        client = attrs.get("client") or getattr(self.instance, "client", None)
        vehicle = attrs.get("vehicle") or getattr(self.instance, "vehicle", None)

        if client and vehicle and vehicle.owner_id != client.id:
            raise serializers.ValidationError(
                {"vehicle_id": "O veículo não pertence ao cliente informado."}
            )

        duration = attrs.get("expected_duration_minutes")
        if duration is not None and duration < 1:
            raise serializers.ValidationError(
                {"expected_duration_minutes": "A duração deve ser de pelo menos 1 minuto."}
            )

        return attrs
