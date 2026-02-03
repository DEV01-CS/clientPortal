from django.contrib import admin
from django.urls import path, include
from accounts.urls import notification_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/sheets/', include('sheets.urls')),
    
    # Mount notification URLs
    path('api/notifications/', include(notification_urlpatterns)),
]
