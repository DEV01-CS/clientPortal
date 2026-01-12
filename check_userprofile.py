#!/usr/bin/env python3
"""
Script to check UserProfile and OAuth status for a user
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'client_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'client_backend.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile, GoogleOAuthToken

def check_user_profile(email=None):
    """Check UserProfile for a user"""
    print("=" * 60)
    print("UserProfile & OAuth Status Checker")
    print("=" * 60)
    print()
    
    if email:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            print(f"❌ User with email '{email}' not found!")
            print("\nAvailable users:")
            for u in User.objects.all():
                print(f"  - {u.email} ({u.username})")
            return
    else:
        # Show all users
        users = User.objects.all()
        if not users:
            print("❌ No users found in database!")
            return
        
        if len(users) == 1:
            user = users[0]
            print(f"Found 1 user: {user.email}")
        else:
            print(f"Found {len(users)} users. Please specify email.")
            print("\nAvailable users:")
            for u in users:
                print(f"  - {u.email} ({u.username})")
            email = input("\nEnter email to check: ").strip()
            if email:
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    print(f"❌ User not found!")
                    return
            else:
                return
    
    print()
    print(f"Checking user: {user.email} ({user.username})")
    print("-" * 60)
    
    # Check UserProfile
    try:
        profile = UserProfile.objects.get(user=user)
        print(f"✅ UserProfile exists")
        print(f"   Client ID: {profile.client_id}")
    except UserProfile.DoesNotExist:
        print(f"❌ UserProfile NOT FOUND")
        print(f"   You need to create a UserProfile with a client_id")
        print()
        create = input("Would you like to create one? (y/n): ").strip().lower()
        if create == 'y':
            client_id = input("Enter client_id (must match a row in Google Sheet): ").strip()
            if client_id:
                profile = UserProfile.objects.create(user=user, client_id=client_id)
                print(f"✅ UserProfile created with client_id: {client_id}")
            else:
                print("❌ client_id cannot be empty")
                return
        else:
            return
    
    # Check OAuth Token
    try:
        oauth_token = GoogleOAuthToken.objects.get(user=user)
        print(f"✅ Google OAuth Token exists")
        print(f"   Created: {oauth_token.created_at}")
        print(f"   Expired: {oauth_token.is_expired()}")
        if oauth_token.token_expiry:
            print(f"   Expires: {oauth_token.token_expiry}")
    except GoogleOAuthToken.DoesNotExist:
        print(f"❌ Google OAuth Token NOT FOUND")
        print(f"   You need to connect your Google account via OAuth")
        print(f"   Go to: http://localhost:3000/my-account and click 'Connect Google'")
    
    print()
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"User: {user.email}")
    print(f"UserProfile: {'✅' if UserProfile.objects.filter(user=user).exists() else '❌'}")
    if UserProfile.objects.filter(user=user).exists():
        print(f"Client ID: {UserProfile.objects.get(user=user).client_id}")
    print(f"OAuth Connected: {'✅' if GoogleOAuthToken.objects.filter(user=user).exists() else '❌'}")
    print()
    
    # Next steps
    if not UserProfile.objects.filter(user=user).exists():
        print("⚠️  Next Step: Create UserProfile with client_id")
    elif not GoogleOAuthToken.objects.filter(user=user).exists():
        print("⚠️  Next Step: Connect Google account via OAuth")
    else:
        print("✅ Everything looks good! You can now test the API endpoints.")
        print("   - Dashboard: http://localhost:3000/dashboard")
        print("   - Test Connection: http://localhost:3000/test-connection")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    check_user_profile(email)

