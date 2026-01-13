from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from accounts.models import UserProfile, GoogleOAuthToken
from .oauth_utils import (
    get_authorization_url,
    exchange_code_for_tokens,
    get_sheets_service as get_oauth_sheets_service,
    get_drive_service as get_oauth_drive_service,
    get_connected_google_email
)
# Old utils.py imports removed - now using OAuth-based functions from oauth_utils.py
from .chatbot import (
    is_relevant_message,
    generate_response,
    get_denial_message
)
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from googleapiclient.errors import HttpError
import logging
import traceback

logger = logging.getLogger(__name__)


# OAuth Endpoints
# In-memory store for OAuth state to user_id mapping
# This is a fallback when sessions don't work
oauth_state_store = {}

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def initiate_oauth(request):
    """Initiate OAuth flow - returns authorization URL"""
    try:
        authorization_url, state = get_authorization_url(request.user)
        
        # Store in both session (primary) and in-memory store (fallback)
        request.session['oauth_state'] = state
        request.session['oauth_user_id'] = request.user.id
        request.session.save()
        
        # Also store in-memory as fallback (expires when server restarts)
        oauth_state_store[state] = {
            'user_id': request.user.id,
            'timestamp': timezone.now()
        }
        
        return Response({
            "authorization_url": authorization_url,
            "state": state
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Changed to AllowAny - Google redirect doesn't include JWT token
def oauth_callback(request):
    """Handle OAuth callback and exchange code for tokens"""
    try:
        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        if error:
            return redirect(f"{frontend_url}/my-account?error={error}")
        
        if not code:
            return redirect(f"{frontend_url}/my-account?error=no_code")
        
        if not state:
            return redirect(f"{frontend_url}/my-account?error=no_state")
        
        # Try to get user_id from multiple sources
        user_id = None
        
        # Method 1: Try session first
        user_id = request.session.get('oauth_user_id')
        session_state = request.session.get('oauth_state')
        
        # Verify state matches if we have it in session
        if session_state and session_state != state:
            return redirect(f"{frontend_url}/my-account?error=invalid_state")
        
        # Method 2: Fallback to in-memory store if session doesn't have it
        if not user_id and state in oauth_state_store:
            state_data = oauth_state_store.pop(state)  # Remove after use
            user_id = state_data.get('user_id')
            if settings.DEBUG:
                logger.debug(f"Retrieved user_id from in-memory store: {user_id}")
        
        if not user_id:
            if settings.DEBUG:
                logger.warning(f"OAuth callback - No user_id found. State: {state}, Session keys: {list(request.session.keys())}")
            return redirect(f"{frontend_url}/my-account?error=session_expired")
        
        # Get user object
        from django.contrib.auth.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return redirect(f"{frontend_url}/my-account?error=user_not_found")
        
        # Exchange code for tokens
        try:
            token_obj = exchange_code_for_tokens(user, code)
            logger.info(f"OAuth tokens saved successfully for user: {user.email}")
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {str(e)}", exc_info=True)
            return redirect(f"{frontend_url}/my-account?error=token_exchange_failed")
        
        # Clear session data
        if 'oauth_state' in request.session:
            del request.session['oauth_state']
        if 'oauth_user_id' in request.session:
            del request.session['oauth_user_id']
        request.session.save()
        
        return redirect(f"{frontend_url}/my-account?success=connected")
    except Exception as e:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        error_msg = str(e)
        logger.error(f"OAuth callback error: {error_msg}", exc_info=True)
        return redirect(f"{frontend_url}/my-account?error=oauth_error")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_oauth_status(request):
    """Check if user has connected their Google account"""
    try:
        token_obj = GoogleOAuthToken.objects.get(user=request.user)
        is_connected = True
        is_expired = token_obj.is_expired()
    except GoogleOAuthToken.DoesNotExist:
        is_connected = False
        is_expired = False
    
    return Response({
        "is_connected": is_connected,
        "is_expired": is_expired
    }, status=status.HTTP_200_OK)


# Helper functions using OAuth
# Note: get_client_row_oauth removed - now using get_input_sheet_data and get_ltp_data_with_mapped_headers
# for consistent data lookup across all endpoints

def get_clients_documents_oauth(user, client_id, sheet_name='Documents'):
    """Get all documents for a specific client from Google Sheets using OAuth"""
    try:
        service = get_oauth_sheets_service(user)
        result = service.spreadsheets().values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=f'{sheet_name}!A:Z'
        ).execute()

        rows = result.get('values', [])
        if not rows:
            return []
            
        headers = rows[0] if rows else []
        documents = []
        
        for row in rows[1:]:
            while len(row) < len(headers):
                row.append('')
            
            row_data = dict(zip(headers, row))
            if str(row_data.get('client_id', '')).strip() == str(client_id).strip():
                documents.append(row_data)
        
        return documents
    except HttpError as e:
        raise Exception(f"Google Sheets API error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error getting client documents: {str(e)}")


def get_google_drive_file_oauth(user, file_id):
    """Get file metadata from Google Drive using OAuth"""
    try:
        drive_service = get_oauth_drive_service(user)
        file_metadata = drive_service.files().get(
            fileId=file_id,
            fields='id, name, mimeType, webViewLink, webContentLink, createdTime, modifiedTime'
        ).execute()
        return file_metadata
    except HttpError as e:
        raise Exception(f"Google Drive API error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error getting Google Drive file: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_google_sheets_connection(request):
    """Test endpoint to verify Google Sheets OAuth connection and list all sheets"""
    try:
        # Use OAuth-based service
        service = get_oauth_sheets_service(request.user)
        sheet = service.spreadsheets()
        
        # Get spreadsheet metadata
        spreadsheet = sheet.get(spreadsheetId=settings.GOOGLE_SHEET_ID).execute()
        spreadsheet_title = spreadsheet.get('properties', {}).get('title', '')
        
        # Get all sheets in the spreadsheet
        sheets_list = spreadsheet.get('sheets', [])
        sheet_info = []
        
        for sheet_item in sheets_list:
            sheet_props = sheet_item.get('properties', {})
            sheet_title = sheet_props.get('title', '')
            sheet_id = sheet_props.get('sheetId', '')
            
            # Try to read first row of each sheet to get headers
            try:
                result = sheet.values().get(
                    spreadsheetId=settings.GOOGLE_SHEET_ID,
                    range=f"'{sheet_title}'!A1:Z1"
                ).execute()
                headers = result.get('values', [[]])[0] if result.get('values') else []
            except Exception as e:
                headers = []
                # Header read failed - continue with empty headers
            
            # Try to read first few rows of column A (for LTP sheet to check client_ids)
            column_a_sample = []
            if sheet_title.upper() == 'LTP':
                try:
                    result = sheet.values().get(
                        spreadsheetId=settings.GOOGLE_SHEET_ID,
                        range=f"'{sheet_title}'!A1:A10"
                    ).execute()
                    rows = result.get('values', [])
                    column_a_sample = [str(row[0]).strip() if row and len(row) > 0 else '' for row in rows[1:6]]  # First 5 data rows
                except Exception as e:
                    # Column A read failed - continue without sample
                    pass
            
            sheet_info.append({
                "title": sheet_title,
                "sheet_id": sheet_id,
                "headers": headers[:10],  # First 10 headers
                "column_a_sample": column_a_sample if sheet_title.upper() == 'LTP' else None
            })
        
        return Response({
            "success": True,
            "message": "Google Sheets OAuth connection successful",
            "spreadsheet_title": spreadsheet_title,
            "spreadsheet_id": settings.GOOGLE_SHEET_ID,
            "sheets": sheet_info,
            "total_sheets": len(sheets_list)
        }, status=status.HTTP_200_OK)
    except GoogleOAuthToken.DoesNotExist:
        return Response({
            "success": False,
            "error": "Google account not connected",
            "message": "Please connect your Google account via OAuth to test the connection."
        }, status=status.HTTP_401_UNAUTHORIZED)
    except HttpError as e:
        # Handle permission errors specifically
        if e.resp.status == 403:
            try:
                connected_email = get_connected_google_email(request.user)
            except:
                connected_email = request.user.email if hasattr(request.user, 'email') else 'Unknown'
            
            return Response({
                "success": False,
                "error": "Permission denied",
                "error_code": 403,
                "connected_google_email": connected_email,
                "spreadsheet_id": settings.GOOGLE_SHEET_ID,
                "message": f"The Google account '{connected_email}' does not have permission to access this spreadsheet. Please share the Google Sheet with this email address.",
                "instructions": [
                    f"1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/{settings.GOOGLE_SHEET_ID}",
                    f"2. Click the 'Share' button (top right)",
                    f"3. Add '{connected_email}' as an editor or viewer",
                    f"4. Make sure to grant 'Viewer' or 'Editor' permissions",
                    "5. Try the connection again"
                ]
            }, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({
                "success": False,
                "error": str(e),
                "error_code": e.resp.status if hasattr(e, 'resp') else None,
                "error_details": traceback.format_exc(),
                "message": "Failed to connect to Google Sheets. Please check the error details."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e),
            "error_details": traceback.format_exc(),
            "message": "Failed to connect to Google Sheets. Please ensure OAuth is configured and your Google account is connected."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_dashboard(request):
    """Get client data from Google Sheets - supports LTP/VR/Input structure with auto-sync"""
    try:
        profile = UserProfile.objects.get(user=request.user)
        
        # Use shared multi-step lookup function
        data = get_client_data_multi_step(request.user, profile, auto_sync_client_id=True)

        if not data:
            return Response({
                "error": "Data not found.",
                "client_id": profile.client_id,
                "email": request.user.email,
                "postcode": profile.postcode,
                "message": f"No data found in Google Sheet. Tried Input/LTP sheets with client_id: {profile.client_id} and email+postcode: {request.user.email} + {profile.postcode}"
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({"data": data}, status=status.HTTP_200_OK)
    except GoogleOAuthToken.DoesNotExist:
        return Response({
            "error": "Google account not connected",
            "message": "Please connect your Google account to access your data."
        }, status=status.HTTP_401_UNAUTHORIZED)
    except UserProfile.DoesNotExist:
        return Response({
            "error": "User profile not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_client_data(request, client_id=None):
    """Test endpoint to fetch data (for testing purposes)
    Supports both client_id and email lookup
    
    Usage: 
    - GET /api/sheets/test-client/{client_id}/
    - GET /api/sheets/test-client/?client_id=99999999
    - GET /api/sheets/test-client/?email=user@example.com
    """
    try:
        # Use provided client_id or get from query parameter
        test_client_id = client_id or request.GET.get('client_id', None)
        test_email = request.GET.get('email', None)
        
        # If no identifier provided, try to use logged-in user's email
        if not test_client_id and not test_email:
            test_email = request.user.email
        
        if not test_client_id and not test_email:
            return Response({
                "error": "client_id or email is required",
                "message": "Please provide client_id or email as URL parameter or query parameter. Example: /api/sheets/test-client/?email=user@example.com"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = None
        matched_identifier = None
        debug_info = {
            "tried_identifiers": [],
            "input_sheet_errors": [],
            "ltp_sheet_errors": [],
            "ltp_sheet_found_ids": []
        }
        
        # If email provided, try email lookup first
        if test_email:
            debug_info["tried_identifiers"].append(f"email: {test_email}")
            # STEP 1: Try LTP sheet with email
            try:
                data = get_ltp_data_with_mapped_headers(
                    request.user,
                    test_email,
                    identifier_column='email',
                    sheet_name='LTP'
                )
                if data:
                    matched_identifier = f"email: {test_email}"
            except Exception as e:
                error_msg = f"LTP sheet email lookup failed: {str(e)}"
                debug_info["ltp_sheet_errors"].append(error_msg)
            
            # If email lookup returned None (column not found), get headers for debugging
            if not data:
                try:
                    service = get_oauth_sheets_service(request.user)
                    sheet = service.spreadsheets()
                    result = sheet.values().get(
                        spreadsheetId=settings.GOOGLE_SHEET_ID,
                        range='LTP!1:2'  # Get row 1 (degrees) and row 2 (headers)
                    ).execute()
                    rows = result.get('values', [])
                    if rows and len(rows) > 1:
                        debug_info["ltp_headers_row2"] = rows[1] if len(rows) > 1 else []
                except:
                    pass
            
            # STEP 2: Try Input sheet with email if not found
            if not data:
                try:
                    data = get_input_sheet_data(
                        request.user,
                        test_email,
                        identifier_column='email',
                        sheet_name='Input'
                    )
                    if data:
                        matched_identifier = f"email: {test_email}"
                except Exception as e:
                    error_msg = f"Input sheet email lookup failed: {str(e)}"
                    debug_info["input_sheet_errors"].append(error_msg)
        
        # If client_id provided or email lookup failed, try client_id
        if not data and test_client_id:
            # Normalize client_id - remove # and trim
            test_client_id_clean = str(test_client_id).replace('#', '').strip()
            
            # Try multiple variations
            test_variations = [
                test_client_id_clean,  # "99999999"
                f"#{test_client_id_clean}",  # "#99999999"
                test_client_id_clean.zfill(8),  # "99999999" (padded if needed)
            ]
            
            debug_info["tried_identifiers"].extend([f"client_id: {v}" for v in test_variations])
            
            # STEP 3: Try LTP sheet with client_id (all variations)
            for variation in test_variations:
                try:
                    data = get_ltp_data_with_mapped_headers(
                        request.user,
                        variation,
                        identifier_column='client_id',
                        sheet_name='LTP'
                    )
                    if data:
                        matched_identifier = f"client_id: {variation}"
                        break
                except Exception as e:
                    error_msg = f"LTP sheet client_id lookup failed for '{variation}': {str(e)}"
                    debug_info["ltp_sheet_errors"].append(error_msg)
            
            # STEP 4: Try Input sheet with client_id (all variations)
            if not data:
                for variation in test_variations:
                    try:
                        data = get_input_sheet_data(
                            request.user,
                            variation,
                            identifier_column='client_id',
                            sheet_name='Input'
                        )
                        if data:
                            matched_identifier = f"client_id: {variation}"
                            break
                    except Exception as e:
                        error_msg = f"Input sheet client_id lookup failed for '{variation}': {str(e)}"
                        debug_info["input_sheet_errors"].append(error_msg)
        
        # STEP 3: Debug - Get sample data from LTP sheet for troubleshooting
        if not data:
            try:
                service = get_oauth_sheets_service(request.user)
                sheet = service.spreadsheets()
                # Get first few rows to see headers and sample data
                result = sheet.values().get(
                    spreadsheetId=settings.GOOGLE_SHEET_ID,
                    range='LTP!A1:B10'  # First 2 columns (client_id, email), first 10 rows
                ).execute()
                rows = result.get('values', [])
                if rows:
                    # Row 1: degrees, Row 2: headers
                    if len(rows) > 1:
                        debug_info["ltp_headers_row2"] = rows[1] if len(rows) > 1 else []
                    if len(rows) > 2:
                        # Get first 5 data rows (row 3-7) showing client_id and email
                        sample_data = []
                        for row in rows[2:7]:
                            if row and len(row) >= 1:
                                sample_data.append({
                                    "client_id": str(row[0]).strip() if len(row) > 0 else '',
                                    "email": str(row[1]).strip() if len(row) > 1 else ''
                                })
                        debug_info["ltp_sample_data"] = sample_data
            except Exception as e:
                debug_info["ltp_sheet_errors"].append(f"Debug scan failed: {str(e)}")
        
        if not data:
            response_data = {
                "error": "Data not found",
                "tried_identifier": test_client_id or test_email or request.user.email,
                "message": f"No data found for {'email: ' + (test_email or request.user.email) if test_email or not test_client_id else 'client_id: ' + str(test_client_id)} in Input or LTP sheets."
            }
            # Only include debug info in development
            if settings.DEBUG:
                response_data["debug_info"] = debug_info
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)
        
        # Remove internal row number from response
        if '_row_number' in data:
            del data['_row_number']
        
        return Response({
            "success": True,
            "matched_identifier": matched_identifier,
            "data": data
        }, status=status.HTTP_200_OK)
        
    except GoogleOAuthToken.DoesNotExist:
        return Response({
            "error": "Google account not connected",
            "message": "Please connect your Google account to access your data."
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({
            "error": str(e),
            "message": f"Error occurred: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_documents(request):
    """Get client documents from Google Sheets and Google Drive"""
    try:
        profile = UserProfile.objects.get(user=request.user)
        # Use OAuth-based function
        docs = get_clients_documents_oauth(request.user, profile.client_id)

        # Process documents to get Google Drive file info if file_id is present
        processed_docs = []
        for doc in docs:
            doc_info = {
                "name": doc.get("name", doc.get("document_name", "")),
                "type": doc.get("type", ""),
                "property": doc.get("property", ""),
                "date": doc.get("date", ""),
                "uploaded_by": doc.get("uploaded_by", ""),
            }
            
            # If there's a Google Drive file_id, fetch file metadata
            file_id = doc.get("file_id") or doc.get("drive_file_id")
            if file_id:
                try:
                    drive_file = get_google_drive_file_oauth(request.user, file_id)
                    doc_info["drive_file"] = {
                        "id": drive_file.get("id"),
                        "name": drive_file.get("name"),
                        "mimeType": drive_file.get("mimeType"),
                        "webViewLink": drive_file.get("webViewLink"),
                        "webContentLink": drive_file.get("webContentLink"),
                        "createdTime": drive_file.get("createdTime"),
                        "modifiedTime": drive_file.get("modifiedTime"),
                    }
                except Exception as e:
                    doc_info["drive_error"] = str(e)
            
            processed_docs.append(doc_info)

        return Response({"documents": processed_docs}, status=status.HTTP_200_OK)
    except GoogleOAuthToken.DoesNotExist:
        return Response({
            "error": "Google account not connected",
            "message": "Please connect your Google account to access your documents."
        }, status=status.HTTP_401_UNAUTHORIZED)
    except UserProfile.DoesNotExist:
        return Response({
            "error": "User profile not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_google_drive_connection(request):
    """Test endpoint to verify Google Drive OAuth connection"""
    try:
        # Use OAuth-based service
        drive_service = get_oauth_drive_service(request.user)
        
        # Try to list files (limited to 10 for testing)
        results = drive_service.files().list(
            pageSize=10,
            fields="files(id, name, mimeType)"
        ).execute()
        
        files = results.get('files', [])
        
        return Response({
            "success": True,
            "message": "Google Drive OAuth connection successful",
            "files_count": len(files),
            "sample_files": files[:5]  # Return first 5 files as sample
        }, status=status.HTTP_200_OK)
    except GoogleOAuthToken.DoesNotExist:
        return Response({
            "success": False,
            "error": "Google account not connected",
            "message": "Please connect your Google account via OAuth to test the connection."
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e),
            "message": "Failed to connect to Google Drive. Please ensure OAuth is configured and your Google account is connected."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chatbot_message(request):
    """
    Chatbot endpoint to handle user messages.
    Only responds to questions related to client services, service charges, property, lease, etc.
    """
    try:
        message = request.data.get('message', '').strip()
        
        if not message:
            return Response({
                "success": False,
                "error": "Message is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get client data if available - use shared lookup function
        client_data = None
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            # Use shared multi-step lookup (without auto-sync for chatbot to avoid unnecessary DB writes)
            client_data = get_client_data_multi_step(request.user, user_profile, auto_sync_client_id=False)
        except (GoogleOAuthToken.DoesNotExist, UserProfile.DoesNotExist):
            pass
        except Exception:
            pass
        
        # Check if message is relevant
        if not is_relevant_message(message):
            return Response({
                "success": True,
                "message": get_denial_message(),
                "is_relevant": False
            }, status=status.HTTP_200_OK)
        
        # Generate response
        response_text = generate_response(message, client_data)
        
        return Response({
            "success": True,
            "message": response_text,
            "is_relevant": True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e),
            "message": "An error occurred while processing your message. Please try again."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_client_data_multi_step(user, profile, auto_sync_client_id=True):
    """Shared function to get client data using multi-step lookup logic
    For new users: Lookup by email first, then extract and save client_id
    For existing users: Lookup by client_id first (faster), then email as fallback
    
    Args:
        user: Django User object
        profile: UserProfile object
        auto_sync_client_id: Whether to auto-sync client_id from Google Sheet (default: True)
    
    Returns:
        Dictionary with client data or None if not found
    """
    data = None
    
    # Check if user has a default client_id (from signup) or a real one from Google Sheet
    # Default client_id format: "client_X" where X is user.id
    has_default_client_id = profile.client_id and profile.client_id.startswith(f"client_{user.id}")
    
    # For new users (with default client_id), prioritize email lookup
    # For existing users (with real client_id from sheet), prioritize client_id lookup
    if has_default_client_id:
        # NEW USER FLOW: Email first, then client_id
        # STEP 1: Try LTP sheet with email (for new users)
        try:
            data = get_ltp_data_with_mapped_headers(
                user,
                user.email,
                identifier_column='email',
                sheet_name='LTP'
            )
        except Exception:
            pass
        
        # STEP 2: Try Input sheet with email if not found in LTP
        if not data:
            try:
                data = get_input_sheet_data(
                    user,
                    user.email,
                    identifier_column='email',
                    sheet_name='Input'
                )
                # If found by email, also check postcode matches if available
                if data and profile.postcode:
                    sheet_postcode = (
                        data.get('postcode') or 
                        data.get('Postcode') or 
                        data.get('postal_code') or
                        data.get('Postal Code')
                    )
                    if sheet_postcode and str(sheet_postcode).strip().upper() != str(profile.postcode).strip().upper():
                        data = None  # Postcode doesn't match
            except Exception:
                pass
        
        # STEP 3: Try with client_id as fallback (in case it was already set)
        if not data and profile.client_id:
            try:
                data = get_ltp_data_with_mapped_headers(
                    user,
                    profile.client_id,
                    identifier_column='client_id',
                    sheet_name='LTP'
                )
            except Exception:
                pass
            
            if not data:
                try:
                    data = get_input_sheet_data(
                        user,
                        profile.client_id,
                        identifier_column='client_id',
                        sheet_name='Input'
                    )
                except Exception:
                    pass
    else:
        # EXISTING USER FLOW: Client_id first (faster), then email as fallback
        # STEP 1: Try LTP sheet with client_id (faster for existing users)
        if profile.client_id:
            try:
                data = get_ltp_data_with_mapped_headers(
                    user,
                    profile.client_id,
                    identifier_column='client_id',
                    sheet_name='LTP'
                )
            except Exception:
                pass
        
        # STEP 2: Try Input sheet with client_id if not found in LTP
        if not data and profile.client_id:
            try:
                data = get_input_sheet_data(
                    user,
                    profile.client_id,
                    identifier_column='client_id',
                    sheet_name='Input'
                )
            except Exception:
                pass
        
        # STEP 3: Fallback to email lookup if client_id didn't work
        if not data:
            try:
                data = get_ltp_data_with_mapped_headers(
                    user,
                    user.email,
                    identifier_column='email',
                    sheet_name='LTP'
                )
            except Exception:
                pass
            
            if not data:
                try:
                    data = get_input_sheet_data(
                        user,
                        user.email,
                        identifier_column='email',
                        sheet_name='Input'
                    )
                    # If found by email, also check postcode matches if available
                    if data and profile.postcode:
                        sheet_postcode = (
                            data.get('postcode') or 
                            data.get('Postcode') or 
                            data.get('postal_code') or
                            data.get('Postal Code')
                        )
                        if sheet_postcode and str(sheet_postcode).strip().upper() != str(profile.postcode).strip().upper():
                            data = None  # Postcode doesn't match
                except Exception:
                    pass
    
    # STEP 4: Auto-sync client_id from Google Sheet if found (always sync for new users)
    if data and auto_sync_client_id:
        sheet_client_id = (
            data.get('client_id') or 
            data.get('Client ID') or 
            data.get('client_ID') or
            data.get('Client_ID') or
            data.get('CLIENT_ID') or
            data.get('client id')  # space version
        )
        
        if sheet_client_id and str(sheet_client_id).strip():
            sheet_client_id = str(sheet_client_id).strip()
            # Always update for new users, or if different for existing users
            if has_default_client_id or profile.client_id != sheet_client_id:
                profile.client_id = sheet_client_id
                profile.save()
    
    # Remove internal row number before returning
    if data and '_row_number' in data:
        del data['_row_number']
    
    return data


def get_first_sheet_name(user):
    """Get the name of the first worksheet in the Google Sheet"""
    try:
        service = get_oauth_sheets_service(user)
        sheet = service.spreadsheets()
        
        # Get spreadsheet metadata
        spreadsheet = sheet.get(spreadsheetId=settings.GOOGLE_SHEET_ID).execute()
        sheets = spreadsheet.get('sheets', [])
        
        if sheets and len(sheets) > 0:
            # Get the first sheet's title
            first_sheet_title = sheets[0].get('properties', {}).get('title', '')
            return first_sheet_title
        
        # Fallback to default if no sheets found
        return 'SCUK Connect'
    except Exception:
        # Fallback to default on error
        return 'SCUK Connect'


def get_vr_unit_mapping(user):
    """Get the mapping of unit codes to header names from VR sheet
    
    Returns a dictionary: {unit_code: header_name}
    Example: {"1"01": "Property Size", "1"02": "Service Charge"}
    """
    try:
        service = get_oauth_sheets_service(user)
        sheet = service.spreadsheets()
        
        # Read VR sheet - Column C (header names) and Column D (unit codes)
        result = sheet.values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range='VR!C:D'
        ).execute()
        
        rows = result.get('values', [])
        if not rows:
            return {}
        
        # Skip header row if present, build mapping
        mapping = {}
        start_idx = 1 if rows and len(rows) > 1 and rows[0] else 0
        
        for row in rows[start_idx:]:
            # Ensure row has at least 2 columns
            while len(row) < 2:
                row.append('')
            
            header_name = str(row[0]).strip() if row[0] else ''
            unit_code = str(row[1]).strip() if len(row) > 1 and row[1] else ''
            
            if unit_code and header_name:
                mapping[unit_code] = header_name
        
        return mapping
    except Exception as e:
        # VR mapping failed - return empty dict
        return {}


def get_ltp_data_with_mapped_headers(user, row_identifier, identifier_column='client_id', sheet_name='LTP'):
    """Get data from LTP sheet -uses row 2 as headers (row 1 has degrees)
    
    Args:
        user: Django User object
        row_identifier: Value to search for (client_id, email, etc.)
        identifier_column: Column name to search in ('client_id' or 'Email')
        sheet_name: Sheet name (default: 'LTP')
    
    Returns:
        Dictionary with header names and their values
    """
    try:
        service = get_oauth_sheets_service(user)
        sheet = service.spreadsheets()
        
        # Read LTP sheet - row 1 has degrees, row 2 has headers
        result = sheet.values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=f'{sheet_name}!A:Z'
        ).execute()
        
        rows = result.get('values', [])
        if not rows or len(rows) < 2:
            return None
        
        # Row 2 (index 1) contains headers
        headers = rows[1] if len(rows) > 1 else []
        if not headers:
            return None
        
        # Find the column index for identifier (client_id or email)
        identifier_col_index = None
        available_headers = [str(h).strip() for h in headers]  # For debugging
        
        for idx, header in enumerate(headers):
            header_lower = str(header).strip().lower()
            # Support variations: client_id, Client ID, client_ID, etc.
            if identifier_column.lower() == 'client_id':
                if header_lower in ['client_id', 'client id', 'clientid']:
                    identifier_col_index = idx
                    break
            elif identifier_column.lower() in ['email', 'email']:
                # Support variations: Email (capitalized), email, E-mail, e-mail, etc.
                # Match exact "Email" or any variation containing 'email'
                if header_lower in ['email', 'e-mail', 'e_mail', 'e mail'] or 'email' in header_lower:
                    identifier_col_index = idx
                    break
        
        if identifier_col_index is None:
            # Return None with debug info - don't raise exception, just return None
            # The calling function will handle the error
            return None
        
        # Normalize the search identifier
        if identifier_column.lower() == 'email':
            # For email, use exact case-insensitive match
            search_id = str(row_identifier).strip().lower()
        else:
            # For client_id, remove # and normalize
            search_id = str(row_identifier).replace('#', '').strip().lower()
        
        # Find matching row - start from row 3 (index 2) since row 1 has degrees, row 2 has headers
        for idx, row in enumerate(rows[2:], start=3):
            while len(row) < len(headers):
                row.append('')
            
            if len(row) > identifier_col_index:
                row_identifier_value = str(row[identifier_col_index]).strip()
                
                # For email: exact case-insensitive match
                if identifier_column.lower() == 'email':
                    row_value_lower = row_identifier_value.lower()
                    if row_value_lower == search_id:
                        # Found matching row, create dictionary with header names
                        row_data = {}
                        for col_idx, header in enumerate(headers):
                            if col_idx < len(row):
                                header_name = str(header).strip()
                                value = str(row[col_idx]).strip() if row[col_idx] else ''
                                # Use header name as key (normalize to lowercase with underscores)
                                key = header_name.lower().replace(' ', '_').replace('-', '_')
                                row_data[key] = value
                                # Also keep original header name for flexibility
                                row_data[header_name] = value
                        
                        row_data['_row_number'] = idx
                        return row_data
                else:
                    # For client_id: match with/without #
                    row_id_clean = row_identifier_value.replace('#', '').strip().lower()
                    if (row_id_clean == search_id or 
                        row_identifier_value.lower() == str(row_identifier).strip().lower()):
                        # Found matching row, create dictionary with header names
                        row_data = {}
                        for col_idx, header in enumerate(headers):
                            if col_idx < len(row):
                                header_name = str(header).strip()
                                value = str(row[col_idx]).strip() if row[col_idx] else ''
                                # Use header name as key (normalize to lowercase with underscores)
                                key = header_name.lower().replace(' ', '_').replace('-', '_')
                                row_data[key] = value
                                # Also keep original header name for flexibility
                                row_data[header_name] = value
                        
                        row_data['_row_number'] = idx
                        return row_data
        
        return None
    except HttpError as e:
        raise Exception(f"Google Sheets API error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error getting LTP data: {str(e)}")


def get_input_sheet_data(user, row_identifier, identifier_column='client_id', sheet_name='Input'):
    """Get data from Input sheet (standard format with readable headers)
    
    Args:
        user: Django User object
        row_identifier: Value to search for (client_id, email, etc.)
        identifier_column: Column name to search in (default: 'client_id')
        sheet_name: Sheet name (default: 'Input')
    
    Returns:
        Dictionary with column names and values
    """
    try:
        service = get_oauth_sheets_service(user)
        sheet = service.spreadsheets()
        
        result = sheet.values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=f'{sheet_name}!A:Z'
        ).execute()
        
        rows = result.get('values', [])
        if not rows:
            return None
        
        headers = rows[0] if rows else []
        
        # Find the column index for identifier
        identifier_col_index = None
        for idx, header in enumerate(headers):
            if str(header).strip().lower() == identifier_column.lower():
                identifier_col_index = idx
                break
        
        if identifier_col_index is None:
            return None
        
        # Normalize the search identifier
        search_id = str(row_identifier).replace('#', '').strip()
        
        # Find matching row
        for idx, row in enumerate(rows[1:], start=2):
            while len(row) < len(headers):
                row.append('')
            
            if len(row) > identifier_col_index:
                row_identifier_value = str(row[identifier_col_index]).strip()
                row_id_clean = row_identifier_value.replace('#', '').strip()
                
                # Match: exact, case-insensitive, with/without #
                if (row_id_clean.lower() == search_id.lower() or 
                    row_identifier_value.lower() == str(row_identifier).strip().lower()):
                    # Found matching row
                    row_data = dict(zip(headers, row))
                    row_data['_row_number'] = idx
                    return row_data
        
        return None
    except HttpError as e:
        raise Exception(f"Google Sheets API error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error getting Input sheet data: {str(e)}")


def get_client_row_by_email_postcode(user, email, postcode, sheet_name=None):
    """Get a specific client's row data from Google Sheets using email and postcode
    
    Args:
        user: Django User object
        email: User's email address
        postcode: User's postcode
        sheet_name: Optional sheet name. If None, uses the first sheet in the spreadsheet
    """
    try:
        service = get_oauth_sheets_service(user)
        sheet = service.spreadsheets()
        
        # If sheet_name not provided, get the first sheet name
        if sheet_name is None:
            sheet_name = get_first_sheet_name(user)

        result = sheet.values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=f'{sheet_name}!A:Z'
        ).execute()

        rows = result.get('values', [])
        if not rows:
            return None
            
        headers = rows[0] if rows else []

        for idx, row in enumerate(rows[1:], start=2):
            while len(row) < len(headers):
                row.append('')

            row_data = dict(zip(headers, row))
            #match by email and postcode
            sheet_email = str(row_data.get('email', '')).strip().lower()
            sheet_postcode = str(row_data.get('postcode', '')).strip().upper()

            if (sheet_email == email.lower() and sheet_postcode == postcode.upper()):
                row_data['_row_number'] = idx
                return row_data

        return None
    except HttpError as e:
        raise Exception(f"Google Sheets API error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error getting client row : {str(e)}")
