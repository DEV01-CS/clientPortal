from .models import Notification

def create_notification(user, message):
    """
    Helper function to create a notification for a user.
    """
    if user and message:
        Notification.objects.create(user=user, message=message)
