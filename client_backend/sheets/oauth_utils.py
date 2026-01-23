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
# Using write scopes to allow document uploads to Google Drive
# Note: If client's Google Sheet is read-only, metadata writing will fail gracefully
# but document uploads to Drive will still work
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',  # Read/write Sheets access (for metadata)
    'https://www.googleapis.com/auth/drive.file'  # Upload files to Google Drive
]

# OAuth  Client Configuration
CLIENT_ID = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
CLIENT_SECRET = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
REDIRECT_URI = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', 'http://localhost:8000/api/sheets/oauth/callback/')

def get_oauth_flow():
    """Create OAuth flow for user authentication"""
    if not CLIENT_ID or not CLIENT_SECRET or str(CLIENT_ID).strip() == '' or str(CLIENT_SECRET).strip() == '':
        raise Exception("Google OAuth credentials not configured.Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in settings.py or environment variables.")
    
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
    import requests
    from google.oauth2.credentials import Credentials
    
    # Google may return additional scopes (e.g., drive.readonly) that we didn't request
    # The oauthlib library raises a Warning as an exception for scope mismatches
    # We'll use requests directly to fetch the token, bypassing oauthlib's scope validation
    
    # Exchange authorization code for tokens using direct HTTP request
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': authorization_code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    try:
        response = requests.post(token_url, data=token_data)
        response.raise_for_status()
        token_response = response.json()
        
        # Extract token information
        access_token = token_response.get('access_token')
        refresh_token = token_response.get('refresh_token')
        expires_in = token_response.get('expires_in', 3600)
        scopes_granted = token_response.get('scope', ' '.join(SCOPES))
        
        if not access_token:
            raise Exception("No access token in response from Google")
        
        # Parse scopes (Google returns them as space-separated string)
        if isinstance(scopes_granted, str):
            scopes_list = scopes_granted.split()
        else:
            scopes_list = SCOPES
        
        # Create credentials object
        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scopes=scopes_list  # Use the scopes Google actually granted
        )
        
        # Set expiry time
        credentials.expiry = timezone.now() + timedelta(seconds=expires_in)
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to exchange authorization code for tokens: {str(e)}")
    except Exception as e:
        raise Exception(f"Error creating OAuth credentials: {str(e)}")
    
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
        # Re-raise the proper exception so views can catch it
        raise
    
    # Create credentials object with all required fields
    # Note: stored token's scopes initially, then update to new scopes if needed
    credentials = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES  # Use current required scopes
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
            error_str = str(e)
            # Check if it's a scope error
            if 'invalid_scope' in error_str or 'Bad Request' in error_str:
                # Delete the old token to force re-authentication with new scopes
                token_obj.delete()
                raise Exception("OAuth scopes have been updated. Please reconnect your Google account to grant the new permissions (including file upload access).")
            raise Exception(f"Failed to refresh OAuth token. Please reconnect your Google account. Error: {str(e)}")
    
    return credentials

def get_sheets_service(user):
    """Get Google Sheets API service using user's OAuth credentials"""
    try:
        credentials = get_user_credentials(user)
        return build('sheets', 'v4', credentials=credentials)
    except GoogleOAuthToken.DoesNotExist:
        # Re-raise OAuth connection errors so views can handle them properly
        raise
    except Exception as e:
        raise Exception(f"Error initializing Google Sheets service: {str(e)}")

def get_drive_service(user):
    """Get Google Drive API service using user's OAuth credentials"""
    try:
        credentials = get_user_credentials(user)
        return build('drive', 'v3', credentials=credentials)
    except GoogleOAuthToken.DoesNotExist:
        # Re-raise OAuth connection errors so views can handle them properly
        raise
    except Exception as e:
        raise Exception(f"Error initializing Google Drive service: {str(e)}")


def get_connected_google_email(user):
    """Get the email address of the Google account connected via OAuth"""
    try:
        credentials = get_user_credentials(user)
        # Use OAuth2 service to get user info
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        return user_info.get('email', 'Unknown')
    except Exception as e:
        # Fallback: return user's email from Django User model
        return user.email if hasattr(user, 'email') else 'Unknown'


#ADMIN OAUTH FUNCTIONS

def get_admin_credentials():
    """Get admin's Google OAuth credentials"""
    from accounts.models import AdminGoogleOAuthToken
    
    if not CLIENT_ID or not CLIENT_SECRET:
        raise Exception("Google OAuth credentials not configured.")
    
    try:
        token_obj = AdminGoogleOAuthToken.objects.get()
    except AdminGoogleOAuthToken.DoesNotExist:
        raise Exception("Admin Google account not connected. Please connect admin's Google account first.")
    
    credentials = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES
    )
    
    # Refresh if expired
    if token_obj.is_expired() and token_obj.refresh_token:
        try:
            credentials.refresh(Request())
            token_obj.access_token = credentials.token
            if credentials.expiry:
                token_obj.token_expiry = credentials.expiry
            token_obj.save()
        except Exception as e:
            raise Exception(f"Failed to refresh admin OAuth token: {str(e)}")
    
    return credentials

def get_admin_sheets_service():
    """Get Google Sheets service using admin's credentials"""
    try:
        credentials = get_admin_credentials()
        return build('sheets', 'v4', credentials=credentials)
    except Exception as e:
        raise Exception(f"Error initializing admin Google Sheets service: {str(e)}")

def get_admin_drive_service():
    """Get Google Drive service using admin's credentials"""
    try:
        credentials = get_admin_credentials()
        return build('drive', 'v3', credentials=credentials)
    except Exception as e:
        raise Exception(f"Error initializing admin Google Drive service: {str(e)}")

def get_or_create_upload_folder(drive_service, folder_name="Client Portal Documents"):
    """Getting or creating a folder in admin's Drive for uploaded documents"""
    try:
        # Search for existing folder
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = drive_service.files().list(
            q=query,
            fields='files(id, name)'
        ).execute()
        
        folders = results.get('files', [])
        if folders:
            return folders[0]['id']  # Return existing folder ID
        
        # Create folder if it doesn't exist
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(
            body=folder_metadata,
            fields='id'
        ).execute()
        
        return folder.get('id')
    except Exception as e:
        raise Exception(f"Error creating/getting upload folder: {str(e)}")

def get_authorization_url_admin():
    """Get OAuth URL for admin connection"""
    flow = get_oauth_flow()
    # Use a special state to identify admin OAuth in callback
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',  # Force consent to get refresh token
        state='admin_oauth'  # Special state to identify admin OAuth
    )
    return authorization_url

def exchange_code_for_tokens_admin(authorization_code):
    """Exchange code for admin's OAuth tokens"""
    from accounts.models import AdminGoogleOAuthToken
    import requests
    
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': authorization_code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    response = requests.post(token_url, data=token_data)
    response.raise_for_status()
    token_response = response.json()
    
    access_token = token_response.get('access_token')
    refresh_token = token_response.get('refresh_token')
    expires_in = token_response.get('expires_in', 3600)
    scopes_granted = token_response.get('scope', ' '.join(SCOPES))
    
    if not access_token:
        raise Exception("No access token in response")
    
    expiry_time = timezone.now() + timedelta(seconds=expires_in)
    
    # Save admin token (only one exists)
    token_obj, created = AdminGoogleOAuthToken.objects.update_or_create(
        defaults={
            'access_token': access_token,
            'refresh_token': refresh_token or '',
            'token_expiry': expiry_time,
            'scopes': scopes_granted
        }
    )
    
    return token_obj

