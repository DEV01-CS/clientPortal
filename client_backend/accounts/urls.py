from django.urls import path
from .views import signup, login, user_profile
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('signup/', signup),
    path('login/', login),  # Custom login with better error messages
    path('token/refresh/', TokenRefreshView.as_view()),
    path('profile/', user_profile),  # Get and update user profile
]
