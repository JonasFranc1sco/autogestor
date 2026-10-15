from django.db import migrations, models


def backfill_closed_at(apps, schema_editor):
    """OS concluídas/canceladas antigas recebem closed_at aproximado (updated_at)."""
    ServiceOrder = apps.get_model("service_order", "ServiceOrder")
    ServiceOrder.objects.filter(
        status__in=["DONE", "CANCELLED"],
        closed_at__isnull=True,
    ).update(closed_at=models.F("updated_at"))


class Migration(migrations.Migration):

    dependencies = [
        ("service_order", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_closed_at, migrations.RunPython.noop),
    ]
