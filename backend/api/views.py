# backend/api/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated # Import missing permission
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.db.models import Sum
from django.utils import timezone
from decimal import Decimal
import io
import os
from django.http import HttpResponse
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt # Para desabilitar CSRF se for uma API pura e você gerencia tokens de outra forma
from django.views.decorators.http import require_POST
from django.db import transaction, IntegrityError
from django.core.validators import validate_email # Para validação de email
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import CustomUser, Event, Attendance, Certificate, Participant
from .serializers import (
    CustomUserSerializer, EventSerializer, AttendanceSerializer, 
    CertificateSerializer, CheckinSerializer, CertificateValidationSerializer
)
# Import the PDF generation utility
from .utils import generate_certificate_pdf 

# Custom Permissions
class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsParticipantUser(permissions.BasePermission):
    """Allows access only to participant users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'participant')

class IsOwnerOrAdmin(permissions.BasePermission):
    """Allows access only to owner of the object or admin users."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if isinstance(obj, CustomUser):
            return obj == request.user
        if isinstance(obj, Attendance):
            return obj.participant == request.user
        if isinstance(obj, Certificate):
            return obj.participant == request.user
        return False

# ViewSets
class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['list', 'destroy']:
            permission_classes = [IsAdminUser]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-start_date')
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Attendance.objects.all().select_related('participant', 'event')
        elif user.role == 'participant':
            return Attendance.objects.filter(participant=user).select_related('participant', 'event')
        return Attendance.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'admin':
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Participants can only register attendance via check-in.")

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        # Let check_in and check_out define their own permissions via decorator
        elif self.action not in ['check_in', 'check_out']:
             self.permission_classes = [IsAuthenticated] # Default for list/retrieve/create(admin)
        return super().get_permissions()

    @action(detail=False, methods=['post'], permission_classes=[IsParticipantUser], serializer_class=CheckinSerializer)
    def check_in(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event_id = serializer.validated_data['event_id']
        qr_data = serializer.validated_data['qr_code_data']
        latitude = serializer.validated_data.get('latitude')
        longitude = serializer.validated_data.get('longitude')

        # --- QR Code Validation Logic --- 
        # This is a placeholder. Real validation would involve:
        # 1. Decoding qr_data: Does it contain a specific token, event ID, timestamp?
        # 2. Verifying the token/data against the event (e.g., check if a specific QR code was generated for this event).
        # 3. Checking event time constraints (is the event active?).
        # 4. Optionally, validating geolocation if provided.
        # For now, we assume qr_data is valid if it exists and event exists.
        is_qr_valid = bool(qr_data) # Placeholder validation

        if not is_qr_valid:
             return Response({'error': 'QR Code inválido ou dados ausentes.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = Event.objects.get(pk=event_id)
            # Add time validation: Check if timezone.now() is within event.start_date and event.end_date?
            # if not (event.start_date <= timezone.now() <= event.end_date):
            #     return Response({'error': 'Evento não está ativo no momento.'}, status=status.HTTP_400_BAD_REQUEST)
        except Event.DoesNotExist:
            return Response({'error': 'Evento não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if already checked-in (and not checked-out) for this event
        existing_attendance = Attendance.objects.filter(
            participant=request.user,
            event=event,
            check_out_time__isnull=True
        ).first()

        if existing_attendance:
            return Response({'status': 'Você já realizou o check-in para este evento e ainda não fez check-out.'}, status=status.HTTP_200_OK)

        # Create new attendance record
        attendance = Attendance.objects.create(
            participant=request.user,
            event=event,
            check_in_time=timezone.now(),
            method='qrcode',
            notes=f"Check-in via QR. Geo: ({latitude}, {longitude})" if latitude and longitude else "Check-in via QR."
        )
        return Response({'status': 'Check-in realizado com sucesso.', 'attendance_id': attendance.id}, status=status.HTTP_201_CREATED)

    # Check-out might need the specific attendance ID to close
    @action(detail=True, methods=['post'], permission_classes=[IsParticipantUser])
    def check_out(self, request, pk=None):
        try:
            # Participant can only check-out their own attendance
            attendance = Attendance.objects.get(pk=pk, participant=request.user, check_out_time__isnull=True)
            attendance.check_out_time = timezone.now()
            attendance.save() # save() method calculates hours
            return Response({'status': 'Check-out realizado com sucesso.', 'calculated_hours': attendance.calculated_hours}, status=status.HTTP_200_OK)
        except Attendance.DoesNotExist:
            return Response({'error': 'Registro de check-in aberto não encontrado para este usuário.'}, status=status.HTTP_404_NOT_FOUND)

class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Certificate.objects.all().select_related('participant')
        elif user.role == 'participant':
            return Certificate.objects.filter(participant=user).select_related('participant')
        return Certificate.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def generate_certificate(self, request):
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({'error': 'ID do participante é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participant = CustomUser.objects.get(pk=participant_id, role='participant')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Participante não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        total_hours = Attendance.objects.filter(
            participant=participant,
            check_in_time__isnull=False,
            check_out_time__isnull=False
        ).aggregate(total=Sum('calculated_hours'))['total'] or Decimal('0.00')

        if total_hours <= 0:
             return Response({'error': 'Participante não possui horas computadas para gerar certificado.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if a recent certificate already exists to avoid duplicates?
        # existing_cert = Certificate.objects.filter(participant=participant, total_hours_at_generation=total_hours).order_by('-issue_date').first()
        # if existing_cert and (timezone.now().date() - existing_cert.issue_date).days < 1: # Avoid generating same cert on same day
        #     serializer = self.get_serializer(existing_cert)
        #     return Response(serializer.data, status=status.HTTP_200_OK)

        certificate = Certificate.objects.create(
            participant=participant,
            total_hours_at_generation=total_hours
        )
        serializer = self.get_serializer(certificate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Use the utility function for PDF generation
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsOwnerOrAdmin])
    def download_pdf(self, request, pk=None):
        try:
            # get_object() automatically uses the queryset and applies IsOwnerOrAdmin permission
            certificate = self.get_object() 
        except Certificate.DoesNotExist: # Should be handled by DRF default 404
             return Response({'error': 'Certificado não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        generate_certificate_pdf(buffer, certificate)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="certificado_{certificate.participant.username}_{certificate.unique_code}.pdf"'
        
        # Optionally save the generated PDF to the Certificate model's FileField
        # from django.core.files.base import ContentFile
        # if not certificate.pdf_file: # Save only if not already saved
        #     certificate.pdf_file.save(f'cert_{certificate.unique_code}.pdf', ContentFile(buffer.getvalue()), save=True)
        #     buffer.seek(0) # Reset buffer pointer after reading for save

        return response

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], serializer_class=CertificateValidationSerializer)
    def validate_certificate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unique_code = serializer.validated_data['unique_code']

        try:
            certificate = Certificate.objects.select_related('participant').get(unique_code=unique_code)
            validation_data = {
                'is_valid': True,
                'participant_name': certificate.participant.get_full_name() or certificate.participant.username,
                'total_hours': certificate.total_hours_at_generation,
                'issue_date': certificate.issue_date,
                # Fetch details dynamically for validation response
                'attended_events': CertificateSerializer(certificate, context=self.get_serializer_context()).data['attended_events_details']
            }
            return Response(validation_data, status=status.HTTP_200_OK)
        except Certificate.DoesNotExist:
            return Response({'is_valid': False, 'error': 'Certificado inválido ou não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt # Use com cautela. Se sua API usa autenticação baseada em token (ex: JWT), é comum.
             # Se for uma aplicação web tradicional com sessões/cookies, você precisará lidar com CSRF.
@require_POST # Garante que esta view só aceite requisições POST
def import_participants_batch_view(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "JSON inválido."}, status=400)

    if not isinstance(data, list):
        return JsonResponse({"success": False, "message": "Entrada inválida. Esperava uma lista de participantes."}, status=400)

    imported_count = 0
    failed_entries = []
    success_entries = []

    # Usar uma transação atômica garante que ou todos os participantes são salvos,
    # ou nenhum é, se ocorrer um erro durante o processo de lote.
    try:
        with transaction.atomic():
            for item_data in data:
                try:
                    cleaned_data = validate_participant_data(item_data)
                    
                    # Verificar duplicatas (exemplo: por email)
                    # A cláusula unique_together ou unique=True no modelo pode lidar com isso no nível do BD,
                    # mas verificar aqui permite um feedback mais granular.
                    if Participant.objects.filter(email=cleaned_data['email']).exists():
                        failed_entries.append({
                            "data_provided": item_data,
                            "status": "skipped",
                            "reason": "Participante já existe (email duplicado)."
                        })
                        continue

                    # Criar novo participante
                    # participant = Participant.objects.create(**cleaned_data)
                    # Ou, se você quiser instanciar e depois salvar (ex: para sinais)
                    participant = Participant(
                        name=cleaned_data['name'],
                        email=cleaned_data['email'],
                        cpf=cleaned_data.get('cpf')
                        # Mapeie outros campos do cleaned_data para o seu modelo Participant
                    )
                    participant.save() # Isso pode levantar IntegrityError se houver constraints no BD

                    success_entries.append({
                        "email": cleaned_data['email'],
                        "name": cleaned_data['name'],
                        "id": participant.id, # ID do participante criado
                        "status": "success"
                    })
                    imported_count += 1

                except DjangoValidationError as e:
                    failed_entries.append({
                        "data_provided": item_data,
                        "status": "error",
                        "reason": "Dados inválidos.",
                        "details": e.message_dict if hasattr(e, 'message_dict') else e.messages
                    })
                except IntegrityError as e: # Erro de integridade do BD (ex: unique constraint)
                    # transaction.atomic() fará rollback se isso não for capturado e tratado aqui
                    failed_entries.append({
                        "data_provided": item_data,
                        "status": "error",
                        "reason": f"Erro de integridade no banco de dados: {str(e)}"
                    })
                except Exception as e: # Outras exceções inesperadas
                    failed_entries.append({
                        "data_provided": item_data,
                        "status": "error",
                        "reason": f"Erro inesperado no servidor: {str(e)}"
                    })
                    # Se uma exceção não tratada ocorrer aqui, transaction.atomic() fará rollback de tudo.

            # Se chegarmos aqui e transaction.atomic() não foi interrompido por uma exceção não capturada,
            # as alterações serão commitadas ao sair do bloco 'with'.

    except Exception as e: # Erro durante o processamento do lote que pode ter causado rollback
        return JsonResponse({
            "success": False,
            "message": f"Erro crítico durante a importação em lote: {str(e)}. Nenhuma alteração foi salva.",
            "imported_count": 0,
            "failed_entries": failed_entries, # Pode ter algumas falhas já coletadas
            "success_entries": []
        }, status=500)

    message = f"{imported_count} participantes importados com sucesso."
    if failed_entries:
        message += f" {len(failed_entries)} participantes falharam, foram ignorados ou continham erros."

    return JsonResponse({
        "success": True,
        "message": message,
        "imported_count": imported_count,
        "failed_entries": failed_entries,
        "success_entries": success_entries
    }, status=200)

def validate_participant_data(data_item):
    """
    Valida os dados de um único participante.
    Retorna um dicionário de dados limpos ou levanta DjangoValidationError.
    """
    cleaned_data = {}
    errors = {}

    # Nome
    name = data_item.get('name')
    if not name or not str(name).strip():
        errors['name'] = 'Nome não pode ser vazio.'
    else:
        cleaned_data['name'] = str(name).strip()

    # Email
    email = data_item.get('email')
    if not email:
        errors['email'] = 'Email não pode ser vazio.'
    else:
        try:
            validate_email(email)
            cleaned_data['email'] = email
        except DjangoValidationError:
            errors['email'] = 'Formato de email inválido.'
    
    # CPF (opcional)
    cpf = data_item.get('cpf')
    if cpf:
        cleaned_cpf = ''.join(filter(str.isdigit, str(cpf)))
        # Adicione validação mais robusta de CPF se necessário
        # if len(cleaned_cpf) != 11:
        #     errors['cpf'] = 'CPF deve ter 11 dígitos.'
        cleaned_data['cpf'] = cleaned_cpf
    else:
        cleaned_data['cpf'] = None
        
    # Adicione validação para outros campos aqui (ex: phone, organization)
    # cleaned_data['phone'] = data_item.get('phone')
    # cleaned_data['organization'] = data_item.get('organization')


    if errors:
        raise DjangoValidationError(errors)
    
    return cleaned_data

