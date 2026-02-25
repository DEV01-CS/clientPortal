from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .serializers import signupSerializer, UserProfileSerializer, NotificationSerializer
from .models import UserProfile, Notification
from .utils import create_notification

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    try:
        serializer = signupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            #welcome notification for the new user
            create_notification(user, f"Welcome to the Client Portal, {user.username}!")
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'An error occurred during signup',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Custom login endpoint with error messages
    Can accepts either username or email
    """
    try:
        username_or_email = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        
        if not username_or_email or not password:
            return Response(
                {'error': 'Credentials required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # to find user by email first, then by username
        try:
            if '@' in username_or_email:
                user = User.objects.get(email=username_or_email)
            else:
                user = User.objects.get(username=username_or_email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Account not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        # Check if user is active
        if not user.is_active:
            return Response(
                {'error': 'Inactive account.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password- this is the key difference
        if not user.check_password(password):
            return Response(
                {'error': 'Wrong password. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'An error occurred during login',
            'detail': str(e) if settings.DEBUG else 'Please try again later'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update user profile
    GET: Returns user profile data
    PUT: Updates user profile data
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        
        if request.method == 'GET':
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Profile updated successfully',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== NOTIFICATION VIEWS ============

class NotificationListView(generics.ListAPIView):
    """
    List all notifications for the authenticated user.
    Can be filtered with `?is_read=false` to get only unread notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        is_read_param = self.request.query_params.get('is_read')
        if is_read_param is not None:
            is_read = is_read_param.lower() in ['true', '1']
            queryset = queryset.filter(is_read=is_read)
        return queryset

class MarkAllAsReadView(APIView):
    """
    Mark all unread notifications for the user as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

class ClearAllView(APIView):
    """
    Delete all notifications for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class DeleteNotificationView(generics.DestroyAPIView):
    """
    Delete a single notification by its ID.
    """
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()

    def get_queryset(self):
        # Ensure user can only delete their own notifications
        return self.queryset.filter(user=self.request.user)
    