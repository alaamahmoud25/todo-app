from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import auth_views
from .views import CategoryViewSet, TaskViewSet

router = DefaultRouter()
# basename is required because the ViewSets use get_queryset instead of a fixed queryset
router.register("categories", CategoryViewSet, basename="category")
router.register("tasks", TaskViewSet, basename="task")

urlpatterns = [
    # Authentication
    path("auth/login/", auth_views.login_view),
    path("auth/register/", auth_views.register_view),
    path("auth/me/", auth_views.me_view),
    path("auth/logout/", auth_views.logout_view),
    path("", include(router.urls)),
]
