from django.contrib import admin
from core.models import Workshop

@admin.register(Workshop)
class WorkshopAdmin(admin.ModelAdmin):
    fields = ("name", "cnpj", "phone", "email")