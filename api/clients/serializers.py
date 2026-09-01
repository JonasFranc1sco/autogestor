from rest_framework import serializers
from .models import Client
from core.serializers import AddressSerializer

class ClientSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    class Meta:
        model = Client
        fields = ['id', 'person_type','name', 'phone','email','address','document', 'responsible', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        
    def create(self, validated_data):
        
        address_data = validated_data.pop('address')
        
        address = Address.objects.create(**address_data)
        
        client = Client.objects.create(address=address, **validated_data)
        
        return client
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        if address_data:
            address = instance.address
            for attr, value in address_data.items():
                setattrs(address, attr, value)
            address.save()
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance