#!/usr/bin/env python3
"""
Comprehensive API Testing Script for Google Sheets Integration
Tests all endpoints including OAuth, Dashboard, Documents, Chatbot, and Connection Tests
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.RESET}")

def test_endpoint(method, url, headers=None, data=None, description=""):
    """Test an API endpoint and return the response"""
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=data)
        else:
            return None, f"Unsupported method: {method}"
        
        return response, None
    except requests.exceptions.ConnectionError:
        return None, "Connection Error: Make sure Django server is running on http://127.0.0.1:8000"
    except Exception as e:
        return None, str(e)

def print_response(response, error=None):
    """Print formatted response"""
    if error:
        print_error(f"Error: {error}")
        return False
    
    status_code = response.status_code
    try:
        response_data = response.json()
    except:
        response_data = response.text
    
    if status_code in [200, 201]:
        print_success(f"Status: {status_code}")
        print(f"Response: {json.dumps(response_data, indent=2)}")
        return True
    else:
        print_error(f"Status: {status_code}")
        print(f"Response: {json.dumps(response_data, indent=2)}")
        return False

def main():
    print_header("API & Google Sheets Integration Test Suite")
    print_info(f"Testing against: {BASE_URL}")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Step 1: Get authentication token
    print_header("Step 1: Authentication")
    print_info("You need to login first to get a JWT token.")
    print_info("Please provide your login credentials or use an existing token.\n")
    
    email = input("Enter your email: ").strip()
    password = input("Enter your password: ").strip()
    
    # Login
    login_url = f"{API_BASE}/accounts/login/"
    login_data = {
        "email": email,
        "password": password
    }
    
    print(f"\nTesting login endpoint: {login_url}")
    response, error = test_endpoint('POST', login_url, data=login_data, description="Login")
    
    if error or not response or response.status_code != 200:
        print_error("Login failed. Please check your credentials.")
        if response:
            print_response(response, error)
        sys.exit(1)
    
    login_result = response.json()
    token = login_result.get('access') or login_result.get('token')
    
    if not token:
        print_error("No token received from login response")
        print(f"Response: {json.dumps(login_result, indent=2)}")
        sys.exit(1)
    
    print_success("Login successful!")
    print_info(f"Token: {token[:50]}...\n")
    
    # Headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Check OAuth Status
    print_header("Step 2: OAuth Status Check")
    oauth_status_url = f"{API_BASE}/sheets/oauth/status/"
    print(f"Testing: {oauth_status_url}")
    response, error = test_endpoint('GET', oauth_status_url, headers=headers)
    
    if response:
        oauth_status = response.json()
        is_connected = oauth_status.get('is_connected', False)
        
        if is_connected:
            print_success("Google account is connected via OAuth")
        else:
            print_warning("Google account is NOT connected")
            print_info("You need to connect your Google account via the frontend (My Account page)")
            print_info("or use the OAuth initiate endpoint to start the flow.\n")
            
            # Try to initiate OAuth
            print_info("Attempting to initiate OAuth flow...")
            oauth_init_url = f"{API_BASE}/sheets/oauth/initiate/"
            response, error = test_endpoint('GET', oauth_init_url, headers=headers)
            if response and response.status_code == 200:
                oauth_data = response.json()
                auth_url = oauth_data.get('authorization_url')
                print_success("OAuth initiation successful!")
                print_info(f"Authorization URL: {auth_url}")
                print_warning("Please visit this URL in your browser to complete OAuth flow")
                print_warning("After completing OAuth, re-run this script to test other endpoints")
                sys.exit(0)
    
    print_response(response, error)
    print()
    
    # Step 3: Test Google Sheets Connection
    print_header("Step 3: Test Google Sheets Connection")
    sheets_test_url = f"{API_BASE}/sheets/test-sheets/"
    print(f"Testing: {sheets_test_url}")
    response, error = test_endpoint('GET', sheets_test_url, headers=headers)
    
    if response:
        if response.status_code == 401:
            print_warning("OAuth not connected. Please connect your Google account first.")
        elif response.status_code == 200:
            print_success("Google Sheets connection successful!")
    
    print_response(response, error)
    print()
    
    # Step 4: Test Google Drive Connection
    print_header("Step 4: Test Google Drive Connection")
    drive_test_url = f"{API_BASE}/sheets/test-drive/"
    print(f"Testing: {drive_test_url}")
    response, error = test_endpoint('GET', drive_test_url, headers=headers)
    
    if response:
        if response.status_code == 401:
            print_warning("OAuth not connected. Please connect your Google account first.")
        elif response.status_code == 200:
            print_success("Google Drive connection successful!")
    
    print_response(response, error)
    print()
    
    # Step 5: Get Client Dashboard Data
    print_header("Step 5: Get Client Dashboard Data")
    dashboard_url = f"{API_BASE}/sheets/dashboard/"
    print(f"Testing: {dashboard_url}")
    response, error = test_endpoint('GET', dashboard_url, headers=headers)
    
    if response:
        if response.status_code == 401:
            print_warning("OAuth not connected. Please connect your Google account first.")
        elif response.status_code == 404:
            print_warning("User profile or client data not found.")
        elif response.status_code == 200:
            print_success("Dashboard data retrieved successfully!")
    
    print_response(response, error)
    print()
    
    # Step 6: Get Client Documents
    print_header("Step 6: Get Client Documents")
    documents_url = f"{API_BASE}/sheets/documents/"
    print(f"Testing: {documents_url}")
    response, error = test_endpoint('GET', documents_url, headers=headers)
    
    if response:
        if response.status_code == 401:
            print_warning("OAuth not connected. Please connect your Google account first.")
        elif response.status_code == 404:
            print_warning("User profile or documents not found.")
        elif response.status_code == 200:
            print_success("Documents retrieved successfully!")
    
    print_response(response, error)
    print()
    
    # Step 7: Test Chatbot
    print_header("Step 7: Test Chatbot API")
    chatbot_url = f"{API_BASE}/sheets/chatbot/"
    
    test_messages = [
        "Hello",
        "What is my service charge?",
        "Tell me about my property",
        "What is the weather today?",  # Should be rejected as off-topic
    ]
    
    for message in test_messages:
        print(f"\nTesting message: '{message}'")
        print(f"Endpoint: {chatbot_url}")
        response, error = test_endpoint('POST', chatbot_url, headers=headers, data={"message": message})
        
        if response:
            if response.status_code == 200:
                result = response.json()
                is_relevant = result.get('is_relevant', True)
                bot_message = result.get('message', '')
                
                if is_relevant:
                    print_success("Message is relevant")
                else:
                    print_warning("Message is off-topic (expected for non-service-related questions)")
                
                print(f"Bot response: {bot_message}")
            else:
                print_error(f"Chatbot request failed with status {response.status_code}")
        
        print_response(response, error)
    
    print()
    
    # Summary
    print_header("Test Summary")
    print_success("All API endpoints have been tested!")
    print_info("Review the results above to identify any issues.")
    print_info(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

