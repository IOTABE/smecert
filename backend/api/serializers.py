# backend/api/serializers.py
from rest_framework import serializers
from .models import CustomUser, Event, Attendance, Certificate
from django.contrib.auth.hashers import make_password
from django.db.models import Sum
from decimal import Decimal

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'password', 'is_staff', 'is_active', 'date_joined'
        )
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}},
            'is_staff': {'read_only': True},
            'is_active': {'read_only': True},
            'date_joined': {'read_only': True},
        }

    def create(self, validated_data):
        # Hash the password before saving
        validated_data['password'] = make_password(validated_data.get('password'))
        # Ensure only admins can create other admins or staff
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'admin':
            # Admin can set role, is_staff, is_active
            pass # Use validated_data as is
        else:
            # Non-admins or anonymous users create standard participants
            validated_data['role'] = 'participant'
            validated_data['is_staff'] = False
            validated_data['is_active'] = True # Or require email verification
        
        user = super().create(validated_data)
        return user

    def update(self, instance, validated_data):
        # Hash the password if it's being updated
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data.get('password'))
        
        # Prevent non-admins from escalating privileges
        request = self.context.get('request')
        if not (request and request.user.is_authenticated and request.user.role == 'admin'):
            validated_data.pop('role', None)
            validated_data.pop('is_staff', None)
            validated_data.pop('is_active', None)
            
        return super().update(instance, validated_data)

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class AttendanceSerializer(serializers.ModelSerializer):
    participant_username = serializers.ReadOnlyField(source='participant.username')
    event_name = serializers.ReadOnlyField(source='event.name')

    class Meta:
        model = Attendance
        fields = (
            'id', 'participant', 'participant_username', 'event', 'event_name', 
            'check_in_time', 'check_out_time', 'calculated_hours', 'method', 'notes'
        )
        read_only_fields = ('calculated_hours',)

    # Add validation if needed, e.g., check_out_time > check_in_time

class CertificateSerializer(serializers.ModelSerializer):
    participant_username = serializers.ReadOnlyField(source='participant.username')
    # Include details about the attended events if needed directly here, 
    # or handle this in a separate endpoint/view logic.
    attended_events_details = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            'id', 'participant', 'participant_username', 'unique_code', 
            'issue_date', 'total_hours_at_generation', 'pdf_file', 
            'attended_events_details'
        )
        read_only_fields = ('unique_code', 'issue_date', 'total_hours_at_generation', 'pdf_file', 'attended_events_details')

    def get_attended_events_details(self, obj):
        # This method provides the detailed list of attended events for the certificate.
        # It queries the Attendance records for the participant associated with this certificate.
        # WARNING: This assumes the certificate covers ALL attendances up to its issue date.
        # A more robust solution might link certificates to specific attendances or date ranges.
        attendances = Attendance.objects.filter(
            participant=obj.participant, 
            check_in_time__isnull=False, 
            check_out_time__isnull=False,
            # Potentially filter by date range if certificate generation logic specifies it
            # check_in_time__date__lte=obj.issue_date 
        ).values('event__name').annotate(hours=Sum('calculated_hours')).order_by('event__name')
        
        details = []
        for item in attendances:
            details.append({
                'event_name': item['event__name'],
                'hours': item['hours']
            })
        return details

# Serializer for participant import (if needed)
class ParticipantImportSerializer(serializers.Serializer):
    file = serializers.FileField()

# Serializer for Check-in (using QR code data)
class CheckinSerializer(serializers.Serializer):
    event_id = serializers.IntegerField()
    # QR code might contain a unique token or directly the user ID/event ID
    qr_code_data = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)

# Serializer for Certificate Validation
class CertificateValidationSerializer(serializers.Serializer):
    unique_code = serializers.UUIDField()

