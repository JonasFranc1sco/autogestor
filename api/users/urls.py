from django.urls import path
from rest_framework.routers import DefaultRouter
from users.views.auth import LoginView, LogoutView
from users.views.users import UserViewSet
from users.views.profile import ProfileView
from users.views.password import ChangePasswordView
from users.views.refresh import RefreshView

router = DefaultRouter()
router.register('users', UserViewSet, basename="user")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="Login",),
    
    path("auth/refresh/", RefreshView.as_view(), name="refresh",),

    path("auth/logout/", LogoutView.as_view(), name="logout"),

    path("profile/", ProfileView.as_view(), name="profile"),
    
    path("profile/change-password", ChangePasswordView.as_view())
]

urlpatterns += router.urls