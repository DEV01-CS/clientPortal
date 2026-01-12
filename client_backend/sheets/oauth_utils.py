import os
from django.conf import settings
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from accounts.models import GoogleOAuthToken
from django.utils import timezone
from datetime import timedelta, datetime

# OAuth Scopes
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly'
]

# OAuth  Client Configurationc
CLIENT_ID = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
CLIENT_SECRET = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
REDIRECT_URI = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', 'http://localhost:8000/api/sheets/oauth/callback/')

def get_oauth_flow():
    """Create OAuth flow for user authentication"""
    if not CLIENT_ID or not CLIENT_SECRET or str(CLIENT_ID).strip() == '' or str(CLIENT_SECRET).strip() == '':
        raise Exception("Google OAuth credentials not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in settings.py or environment variables.")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    return flow

def get_authorization_url(user):
    """Get Google OAuth authorization URL"""
    flow = get_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'  # Force consent to get refresh token
    )
    # Store state in session or cache (you can use Django sessions)
    return authorization_url, state

def exchange_code_for_tokens(user, authorization_code):
    """Exchange authorization code for access and refresh tokens"""
    flow = get_oauth_flow()
    flow.fetch_token(code=authorization_code)
    
    credentials = flow.credentials
    
    # Calculate expiry time - credentials.expiry is already a datetime
    expiry_time = None
    if credentials.expiry:
        # Convert to timezone-aware datetime if needed
        if isinstance(credentials.expiry, datetime) and timezone.is_naive(credentials.expiry):
            expiry_time = timezone.make_aware(credentials.expiry)
        else:
            expiry_time = credentials.expiry
    
    # Save tokens to database
    token_obj, created = GoogleOAuthToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_expiry': expiry_time or (timezone.now() + timedelta(seconds=3600))
        }
    )
    
    return token_obj

def get_user_credentials(user):
    """Get valid credentials for a user, refreshing if necessary"""
    # Validate OAuth configuration
    if not CLIENT_ID or not CLIENT_SECRET or str(CLIENT_ID).strip() == '' or str(CLIENT_SECRET).strip() == '':
        raise Exception("Google OAuth credentials not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in settings.py or environment variables.")
    
    try:
        token_obj = GoogleOAuthToken.objects.get(user=user)
    except GoogleOAuthToken.DoesNotExist:
        raise Exception("User has not connected their Google account. Please complete OAuth flow.")
    
    # Create credentials object with all required fields
    credentials = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES
    )
    
    # Check if token is expired and refresh if needed
    if token_obj.is_expired() and token_obj.refresh_token:
        try:
            # Refresh the token
            credentials.refresh(Request())
            
            # Update stored token
            expiry_time = None
            if credentials.expiry:
                # Convert to timezone-aware datetime if needed
                if isinstance(credentials.expiry, datetime) and timezone.is_naive(credentials.expiry):
                    expiry_time = timezone.make_aware(credentials.expiry)
                else:
                    expiry_time = credentials.expiry
            
            token_obj.access_token = credentials.token
            token_obj.token_expiry = expiry_time or (timezone.now() + timedelta(seconds=3600))
            token_obj.save()
        except Exception as e:
            raise Exception(f"Failed to refresh OAuth token. Please reconnect your Google account. Error: {str(e)}")
    
    return credentials

def get_sheets_service(user):
    """Get Google Sheets API service using user's OAuth credentials"""
    try:
        credentials = get_user_credentials(user)
        return build('sheets', 'v4', credentials=credentials)
    except Exception as e:
        raise Exception(f"Error initializing Google Sheets service: {str(e)}")

def get_drive_service(user):
    """Get Google Drive API service using user's OAuth credentials"""
    try:
        credentials = get_user_credentials(user)
        return build('drive', 'v3', credentials=credentials)
    except Exception as e:
        raise Exception(f"Error initializing Google Drive service: {str(e)}")


def get_connected_google_email(user):
    """Get the email address of the Google account connected via OAuth"""
    try:
        credentials = get_user_credentials(user)
        # Use OAuth2 service to get user info
        from googleapiclient.discovery import build
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        return user_info.get('email', 'Unknown')
    except Exception as e:
        # Fallback: return user's email from Django User model
        return user.email if hasattr(user, 'email') else 'Unknown'

