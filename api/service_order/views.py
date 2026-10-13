from rest_framework import viewsets
from .models import ServiceOrder
from .serializers import ServiceOrderSerializer


class ServiceOrderViewSet(viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.select_related(
        "client", "vehicle", "mechanic"
    ).prefetch_related(
        "services__service", "products__product"
    ).all()
    serializer_class = ServiceOrderSerializer
