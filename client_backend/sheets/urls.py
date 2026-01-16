from django.urls import path
from .views import (
    client_dashboard, 
    client_documents,
    upload_document,
    test_google_sheets_connection,
    test_google_drive_connection,
    chatbot_message,
    initiate_oauth,
    oauth_callback,
    check_oauth_status,
    test_client_data,
    admin_oauth_status,
    admin_oauth_initiate,
    admin_oauth_callback,
    admin_oauth_test_initiate,
    admin_oauth_test_status
)


urlpatterns = [
    # OAuth endpoints (user-specific)
    path('oauth/initiate/', initiate_oauth, name='initiate_oauth'),
    path('oauth/callback/', oauth_callback, name='oauth_callback'),
    path('oauth/status/', check_oauth_status, name='check_oauth_status'),
    
    # Admin OAuth endpoints
    path('oauth/admin/status/', admin_oauth_status, name='admin_oauth_status'),
    path('oauth/admin/initiate/', admin_oauth_initiate, name='admin_oauth_initiate'),
    path('oauth/admin/callback/', admin_oauth_callback, name='admin_oauth_callback'),
    path('oauth/admin/test/', admin_oauth_test_initiate, name='admin_oauth_test'),
    path('oauth/admin/test-status/', admin_oauth_test_status, name='admin_oauth_test_status'),
    
    # Existing endpoints
    path('dashboard/', client_dashboard, name='client_dashboard'),
    path('documents/', client_documents, name='client_documents'),
    path('documents/upload/', upload_document, name='upload_document'),
    path('test-sheets/', test_google_sheets_connection, name='test_sheets'),
    path('test-drive/', test_google_drive_connection, name='test_drive'),
    path('chatbot/', chatbot_message, name='chatbot_message'),
    
    # Test endpoint for client ID
    path('test-client/<str:client_id>/', test_client_data, name='test_client_data'),
    path('test-client/', test_client_data, name='test_client_data_query'),
]

