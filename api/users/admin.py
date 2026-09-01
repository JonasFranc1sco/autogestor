from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.translation import gettext_lazy as _

from users.models import User


class CustomUserCreationForm(UserCreationForm):
    class Meta: #type: ignore
        model = User
        fields = ("email", "full_name", "role")


class CustomUserChangeForm(UserChangeForm):
    class Meta: #type: ignore
        model = User
        fields = ("email", "full_name", "role", "is_active", "is_staff")


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User

    ordering = ("email",)
    list_display = ("email", "full_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Informações pessoais"), {"fields": ("full_name", "role")}),
        (
            _("Permissões"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )

    search_fields = ("email", "full_name")
