from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

# Language-neutral routes: the API returns codes and the frontend translates them
urlpatterns = [
    path("api/", include("tasks.urls")),
    # The Django root redirects to the API
    path("", RedirectView.as_view(url="/api/", permanent=False)),
]

# Localized routes: the admin lives at /ar/admin/ and /en/admin/
urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
)
