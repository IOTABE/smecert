# backend/api/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from decimal import Decimal
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('participant', 'Participante'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='participant')
    # Add any other user-specific fields if needed, e.g.:
    # cpf = models.CharField(max_length=14, unique=True, null=True, blank=True) # Example

    def __str__(self):
        return self.username

class Event(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    total_workload = models.DecimalField(max_digits=5, decimal_places=2, help_text="Carga horária total do evento em horas.")
    location = models.CharField(max_length=255)
    speakers = models.TextField(blank=True, help_text="Nomes dos palestrantes, separados por vírgula ou um por linha.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Attendance(models.Model):
    METHOD_CHOICES = (
        ('manual', 'Manual'),
        ('qrcode', 'QR Code'),
        ('import', 'Importação'),
    )
    participant = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendances')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    # calculated_hours stores the duration for this specific attendance record (check-in/out pair)
    calculated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='manual')
    notes = models.TextField(blank=True, help_text="Observações sobre esta frequência específica.")

    def save(self, *args, **kwargs):
        if self.check_in_time and self.check_out_time:
            duration = self.check_out_time - self.check_in_time
            self.calculated_hours = Decimal(duration.total_seconds() / 3600)
        else:
            self.calculated_hours = Decimal('0.00')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.participant.username} - {self.event.name} ({self.check_in_time} - {self.check_out_time})"

    class Meta:
        # Ensure a participant cannot have overlapping attendance for the same event?
        # This might be complex to enforce purely at DB level if multiple check-ins are allowed.
        # Business logic validation might be better.
        ordering = ['event', 'participant', 'check_in_time']


class Certificate(models.Model):
    participant = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='certificates')
    unique_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    issue_date = models.DateField(auto_now_add=True)
    # Stores the total hours calculated at the moment the certificate was generated
    total_hours_at_generation = models.DecimalField(max_digits=7, decimal_places=2)
    # Optionally store the generated PDF
    pdf_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    # We might need a way to link this certificate to the specific Attendance records it covers,
    # perhaps a ManyToManyField to Attendance, or store the generation parameters (e.g., date range).
    # For now, generation logic will query Attendance based on participant and potentially a date range.

    def __str__(self):
        return f"Certificado para {self.participant.username} - {self.issue_date} ({self.unique_code})"

    class Meta:
        ordering = ['-issue_date', 'participant']


class Participant(models.Model):
    name = models.CharField(max_length=255, blank=False, null=False)
    email = models.EmailField(unique=True, blank=False, null=False, validators=[validate_email])
    cpf = models.CharField(max_length=14, blank=True, null=True, unique=True) # Ex: 111.222.333-44. unique=True se CPF deve ser único
    # Adicione outros campos conforme necessário
    # phone = models.CharField(max_length=20, blank=True, null=True)
    # organization = models.CharField(max_length=255, blank=True, null=True)
    # created_at = models.DateTimeField(auto_now_add=True)
    # updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def clean(self):
        super().clean() # Chama a validação do modelo pai
        if self.cpf:
            cleaned_cpf = ''.join(filter(str.isdigit, self.cpf))
            if len(cleaned_cpf) != 11 and len(cleaned_cpf) != 0 : # Permite CPF vazio se blank=True
                # raise ValidationError({'cpf': 'CPF deve ter 11 dígitos.'}) # Ou normalize
                pass 
            self.cpf = cleaned_cpf # Normaliza o CPF antes de salvar

    # class Meta:
    #     verbose_name = "Participante"
    #     verbose_name_plural = "Participantes"

