from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

# Create your models here.
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    client_id = models.CharField(max_length=255, unique=True)
    postcode = models.CharField(max_length=20, null=True, blank=True)
    
    # Additional profile fields
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.client_id}"


class GoogleOAuthToken(models.Model):
    """Store OAuth tokens for each user"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_oauth_token')
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        if not self.token_expiry:
            return True
        return timezone.now() >= self.token_expiry

    def __str__(self):
        return f"{self.user.username} - Google OAuth Token"


class AdminGoogleOAuthToken(models.Model):
    """Store admin's Google OAuth credentials for Sheets and Drive access"""
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    scopes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def is_expired(self):
        if not self.token_expiry:
            return True
        return timezone.now() >= self.token_expiry
    
    class Meta:
        verbose_name = "Admin Google OAuth Token"
        verbose_name_plural = "Admin Google OAuth Tokens"
    
    def save(self, *args, **kwargs):
        # Ensure only one admin token exists
        if not self.pk and AdminGoogleOAuthToken.objects.exists():
            # Delete existing token if creating new one
            AdminGoogleOAuthToken.objects.all().delete()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Admin Google OAuth Token - Created: {self.created_at}"

