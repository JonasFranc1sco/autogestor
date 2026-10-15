from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from products.models import Product, StockMovement


class StockService:
    """Registro de movimentações de estoque com atualização atômica do saldo."""

    @staticmethod
    @transaction.atomic
    def register_movement(
        *,
        product: Product,
        movement_type: str,
        quantity: int,
        reason: str,
        service_order=None,
        user=None,
    ) -> StockMovement:
        if quantity == 0:
            raise ValidationError({"quantity": "A quantidade da movimentação não pode ser zero."})

        if movement_type == StockMovement.MovementType.IN and quantity < 0:
            raise ValidationError({"quantity": "Entradas devem ter quantidade positiva."})

        if movement_type == StockMovement.MovementType.OUT and quantity > 0:
            raise ValidationError({"quantity": "Saídas devem ter quantidade negativa."})

        if quantity < 0:
            updated = Product.objects.filter(
                pk=product.pk,
                stock_quantity__gte=abs(quantity),
            ).update(stock_quantity=F("stock_quantity") + quantity)
            if not updated:
                raise ValidationError(
                    {"quantity": "Estoque insuficiente para esta movimentação."}
                )
        else:
            Product.objects.filter(pk=product.pk).update(
                stock_quantity=F("stock_quantity") + quantity
            )

        product.refresh_from_db()

        return StockMovement.objects.create(
            workshop=product.workshop,
            product=product,
            movement_type=movement_type,
            quantity=quantity,
            reason=reason[:255],
            service_order=service_order,
            created_by=user,
            stock_after=product.stock_quantity,
        )

    @staticmethod
    @transaction.atomic
    def release_service_order_stock(service_order, user=None, reason: str | None = None):
        """Devolve ao estoque as peças de uma OS, no máximo uma única vez.

        OS concluída (DONE) não devolve peças: elas foram consumidas no serviço.
        """
        from products.models import StockMovement
        from service_order.models import ServiceOrder

        locked = ServiceOrder.objects.select_for_update().get(pk=service_order.pk)

        if locked.stock_released:
            return

        if locked.status == ServiceOrder.Status.DONE:
            return

        for item in locked.products.all():
            if item.quantity <= 0:
                continue
            StockService.register_movement(
                product=item.product,
                movement_type=StockMovement.MovementType.IN,
                quantity=item.quantity,
                reason=reason or f"Devolução OS #{locked.number}",
                service_order=locked,
                user=user,
            )

        locked.stock_released = True
        locked.save(update_fields=["stock_released", "updated_at"])
