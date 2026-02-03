from django.urls import path
from .views import (signup, 
                    login, 
                    user_profile,
                    NotificationListView, 
                    MarkAllAsReadView, 
                    ClearAllView, 
                    DeleteNotificationView)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('signup/', signup),
    path('login/', login),  # Custom login with better error messages
    path('token/refresh/', TokenRefreshView.as_view()),
    path('profile/', user_profile),  # Get and update user profile
]
# These URLs will be mounted under /api/notifications/
notification_urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('mark-all-as-read/', MarkAllAsReadView.as_view(), name='notification-mark-all-read'),
    path('clear-all/', ClearAllView.as_view(), name='notification-clear-all'),
    path('<int:pk>/delete/', DeleteNotificationView.as_view(), name='notification-delete'),
]