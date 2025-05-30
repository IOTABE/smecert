from django.contrib import admin

# Register your models here.
from .models import CustomUser, Event, Attendance, Certificate


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'first_name', 'last_name')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('role',)
    
    
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'total_workload', 'location')
    search_fields = ('name', 'location')
    list_filter = ('start_date', 'end_date')
    ordering = ('start_date',)
    
    
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('participant', 'event', 'check_in_time', 'check_out_time', 'calculated_hours', 'method')
    search_fields = ('participant__username', 'event__name')
    list_filter = ('method', 'check_in_time', 'check_out_time')
    ordering = ('-check_in_time',)
    
    
@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('participant',  'issue_date', 'total_hours_at_generation')
    search_fields = ('participant__username', 'event__name')
    list_filter = ('issue_date',)
    ordering = ('-issue_date',) 