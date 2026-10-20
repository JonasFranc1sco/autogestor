from django.db.models import F
from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Workshop
from core.serializers import WorkshopSerializer
from users.permissions import IsManagerOrAdmin
from core.tenancy import tenant_of


class WorkshopView(generics.RetrieveUpdateAPIView):
    """Dados da oficina do usuário autenticado."""

    serializer_class = WorkshopSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def get_object(self):
        workshop = tenant_of(self.request.user)
        if workshop is None:
            raise NotFound("Usuário da plataforma não possui oficina associada.")
        return workshop


class DashboardView(APIView):
    """Indicadores da oficina para o dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        from django.utils import timezone

        from service_order.models import ServiceOrder
        from clients.models import Client
        from vehicles.models import Vehicle
        from products.models import Product

        workshop = tenant_of(request.user)
        if workshop is None:
            raise NotFound("Usuário da plataforma não possui oficina associada.")

        orders = ServiceOrder.objects.filter(workshop=workshop)
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        counts = {
            "open_service_orders": orders.filter(status=ServiceOrder.Status.OPEN).count(),
            "in_progress_service_orders": orders.filter(
                status__in=[ServiceOrder.Status.IN_PROGRESS, ServiceOrder.Status.WAITING_PARTS, ServiceOrder.Status.WAITING_CLIENT]
            ).count(),
            "done_this_month": orders.filter(status=ServiceOrder.Status.DONE, closed_at__gte=month_start).count(),
            "clients": Client.objects.filter(workshop=workshop, is_active=True).count(),
            "vehicles": Vehicle.objects.filter(workshop=workshop, is_active=True).count(),
        }

        revenue = orders.filter(
            status=ServiceOrder.Status.DONE, closed_at__gte=month_start
        ).aggregate(total=Sum("total_price"))["total"] or 0

        recent_service_orders = [
            {
                "id": str(order.id),
                "number": order.number,
                "client_name": order.client.name,
                "vehicle_plate": order.vehicle.license_plate,
                "status": order.status,
                "total_price": str(order.total_price),
                "created_at": order.created_at.isoformat(),
            }
            for order in orders.select_related("client", "vehicle")[:5]
        ]

        low_stock_products = [
            {
                "id": str(product.id),
                "name": product.name,
                "stock_quantity": product.stock_quantity,
                "min_stock_quantity": product.min_stock_quantity,
            }
            for product in Product.objects.filter(
                workshop=workshop,
                is_active=True,
                stock_quantity__lte=F("min_stock_quantity"),
            ).order_by("stock_quantity")[:5]
        ]

        return Response({
            "counts": counts,
            "revenue_this_month": f"{revenue:.2f}",
            "recent_service_orders": recent_service_orders,
            "low_stock_products": low_stock_products,
        })


class CashRegisterView(APIView):
    """Resumo do caixa diário por forma de pagamento."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import datetime

        from service_order.models import ServiceOrderPayment

        workshop = tenant_of(request.user)
        if workshop is None:
            raise NotFound("Usuário da plataforma não possui oficina associada.")

        date_param = request.query_params.get("date")
        if date_param:
            try:
                day = datetime.strptime(date_param, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "Data inválida. Use o formato YYYY-MM-DD."},
                    status=400,
                )
        else:
            day = timezone.localdate()

        start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(day, datetime.max.time()))

        payments = ServiceOrderPayment.objects.filter(
            workshop=workshop,
            paid_at__range=(start, end),
        )

        by_method = {
            row["method"]: row["total"]
            for row in payments.values("method").annotate(total=Sum("amount"))
        }
        methods = [
            {
                "method": key,
                "label": label,
                "total": f"{by_method.get(key, 0):.2f}",
            }
            for key, label in ServiceOrderPayment.Method.choices
        ]

        total = payments.aggregate(total=Sum("amount"))["total"] or 0

        return Response({
            "date": day.isoformat(),
            "methods": methods,
            "total": f"{total:.2f}",
            "payments_count": payments.count(),
        })


class ReportsView(APIView):
    """Relatórios gerenciais da oficina."""

    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
        from django.utils import timezone
        from datetime import datetime

        from service_order.models import ServiceOrder, ServiceOrderService, ServiceOrderProduct, ServiceOrderPayment

        workshop = tenant_of(request.user)
        if workshop is None:
            raise NotFound("Usuário da plataforma não possui oficina associada.")

        def parse_date(param, default):
            value = request.query_params.get(param)
            if not value:
                return default
            try:
                return datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                return None

        today = timezone.localdate()
        date_from = parse_date("date_from", today.replace(day=1))
        date_to = parse_date("date_to", today)
        if date_from is None or date_to is None:
            return Response(
                {"detail": "Datas inválidas. Use o formato YYYY-MM-DD."},
                status=400,
            )

        start = timezone.make_aware(datetime.combine(date_from, datetime.min.time()))
        end = timezone.make_aware(datetime.combine(date_to, datetime.max.time()))

        orders = ServiceOrder.objects.filter(
            workshop=workshop, created_at__range=(start, end)
        )
        done = orders.filter(status=ServiceOrder.Status.DONE)
        payments = ServiceOrderPayment.objects.filter(
            workshop=workshop, paid_at__range=(start, end)
        )

        money = DecimalField(max_digits=14, decimal_places=2)

        top_services = [
            {
                "name": row["service__name"],
                "quantity": row["total_quantity"],
                "total": f"{row['total']:.2f}",
            }
            for row in (
                ServiceOrderService.objects
                .filter(
                    service_order__workshop=workshop,
                    created_at__range=(start, end),
                )
                .exclude(service_order__status=ServiceOrder.Status.CANCELLED)
                .values("service__name")
                .annotate(
                    total_quantity=Count("id"),
                    total=Sum(
                        ExpressionWrapper(F("price") - F("discount"), output_field=money)
                    ),
                )
                .order_by("-total")[:10]
            )
        ]

        top_products = [
            {
                "name": row["product__name"],
                "quantity": row["total_quantity"],
                "total": f"{row['total']:.2f}",
            }
            for row in (
                ServiceOrderProduct.objects
                .filter(
                    service_order__workshop=workshop,
                    created_at__range=(start, end),
                )
                .exclude(service_order__status=ServiceOrder.Status.CANCELLED)
                .values("product__name")
                .annotate(
                    total_quantity=Sum("quantity"),
                    total=Sum(
                        ExpressionWrapper(
                            F("price") * F("quantity") - F("discount"),
                            output_field=money,
                        )
                    ),
                )
                .order_by("-total")[:10]
            )
        ]

        mechanic_productivity = [
            {
                "mechanic": row["mechanic__name"],
                "orders": row["orders"],
                "revenue": f"{row['revenue']:.2f}",
            }
            for row in (
                ServiceOrderService.objects
                .filter(service_order__in=done)
                .exclude(mechanic=None)
                .values("mechanic__name")
                .annotate(
                    orders=Count("service_order", distinct=True),
                    revenue=Sum(
                        ExpressionWrapper(F("price") - F("discount"), output_field=money)
                    ),
                )
                .order_by("-revenue")
            )
        ]

        payments_by_method = [
            {"method": row["method"], "total": f"{row['total']:.2f}"}
            for row in (
                payments.values("method").annotate(total=Sum("amount")).order_by("-total")
            )
        ]

        return Response({
            "period": {"date_from": date_from.isoformat(), "date_to": date_to.isoformat()},
            "summary": {
                "orders": orders.count(),
                "done_orders": done.count(),
                "cancelled_orders": orders.filter(status=ServiceOrder.Status.CANCELLED).count(),
                "revenue_done": f"{(done.aggregate(total=Sum('total_price'))['total'] or 0):.2f}",
                "received": f"{(payments.aggregate(total=Sum('amount'))['total'] or 0):.2f}",
            },
            "top_services": top_services,
            "top_products": top_products,
            "mechanic_productivity": mechanic_productivity,
            "payments_by_method": payments_by_method,
        })


class CepLookupView(APIView):
    """Consulta de CEP em serviços públicos (BrasilAPI/ViaCEP)."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "lookup"

    def get(self, request):
        from core.lookups import InvalidValueError, LookupError, NotFoundError, fetch_cep

        cep = request.query_params.get("cep", "")
        try:
            return Response(fetch_cep(cep))
        except InvalidValueError as error:
            return Response({"detail": str(error)}, status=400)
        except NotFoundError:
            return Response(
                {"detail": "CEP não encontrado."},
                status=404,
            )
        except LookupError as error:
            return Response({"detail": str(error)}, status=503)
