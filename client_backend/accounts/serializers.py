from django.contrib.auth.models import User
from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'phone', 'country', 
            'city', 'postcode', 'address', 'tax_id',
            'email', 'username'
        ]
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'country': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'postcode': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'tax_id': {'required': False, 'allow_blank': True},
        }

class signupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, max_length=150)
    postcode = serializers.CharField(required=False, max_length=20, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'postcode']

    def validate_username(self, value):
        # Check if username already exists
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # Extract postcode before creating user
        postcode = validated_data.pop('postcode', None)

        # Create user - signal will automatically create UserProfile
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Update postcode if provided (signal creates profile but may not have postcode)
        if postcode:
            try:
                profile = UserProfile.objects.get(user=user)
                profile.postcode = postcode
                profile.save()
            except UserProfile.DoesNotExist:
                # If signal didn't create it (shouldn't happen), create it now
                UserProfile.objects.create(
                    user=user,
                    client_id=f"client_{user.id}",
                    postcode=postcode
                )
        
        return user