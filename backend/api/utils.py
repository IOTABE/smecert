# backend/api/utils.py
import qrcode
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph
from django.conf import settings
from django.urls import reverse # To build validation URL
from .models import Attendance
from django.db.models import Sum
import os # For cleaning up QR code temp file

def generate_qr_code_img(data):
    """Generates a QR code image object in memory."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    return img

def generate_certificate_pdf(buffer, certificate):
    """Generates the certificate PDF content into the provided buffer."""
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    styles = getSampleStyleSheet()
    style_normal = styles["Normal"]
    style_normal.fontSize = 10
    style_bold = styles["h6"]
    style_bold.fontSize = 11

    # --- Page 1: Main Certificate --- 
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(width / 2.0, height - 1.5*inch, "CERTIFICADO DE PARTICIPAÇÃO")

    p.setFont("Helvetica", 12)
    text_y = height - 3*inch
    p.drawString(inch, text_y, f"Certificamos que")
    p.setFont("Helvetica-Bold", 12)
    p.drawString(inch + 1.2*inch, text_y, f"{certificate.participant.get_full_name() or certificate.participant.username}")
    
    p.setFont("Helvetica", 12)
    text_y -= 0.5*inch
    p.drawString(inch, text_y, f"participou de eventos e atividades organizados por [Nome da Organização]",)
    text_y -= 0.3*inch
    p.drawString(inch, text_y, f"totalizando uma carga horária de")
    p.setFont("Helvetica-Bold", 14)
    p.drawString(inch + 3.5*inch, text_y, f"{certificate.total_hours_at_generation} horas.")

    p.setFont("Helvetica", 10)
    p.drawString(inch, 2*inch, f"Emitido em: {certificate.issue_date.strftime("%d/%m/%Y")}")
    p.drawString(inch, 1.8*inch, f"Código de Validação: {certificate.unique_code}")

    # Add QR Code for validation
    # IMPORTANT: Replace 'YOUR_FRONTEND_VALIDATION_URL_BASE' with the actual frontend URL
    # In a real app, this URL should come from settings or environment variables
    validation_url_base = os.environ.get("FRONTEND_VALIDATION_URL", "http://localhost:3000/validate-certificate") 
    validation_url = f"{validation_url_base}?code={certificate.unique_code}"
    qr_img = generate_qr_code_img(validation_url)
    
    # Save QR code to a temporary buffer to draw it
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # Draw QR code from buffer
    # Need Pillow installed for drawImage to read from buffer directly
    # If using older ReportLab or missing Pillow features, save to temp file first
    from reportlab.lib.utils import ImageReader
    qr_reader = ImageReader(qr_buffer)
    p.drawImage(qr_reader, width - 2*inch, 1.5*inch, width=1*inch, height=1*inch, mask="auto")
    qr_buffer.close()

    p.showPage() # End Page 1

    # --- Page 2: Detailed List --- 
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(width / 2.0, height - 1.5*inch, "DETALHAMENTO DE PARTICIPAÇÃO")

    # Table Header
    header_y = height - 2.5*inch
    p.setFont("Helvetica-Bold", 11)
    p.drawString(inch, header_y, "Evento")
    p.drawString(width - 2*inch, header_y, "Horas")
    p.line(inch, header_y - 0.1*inch, width - inch, header_y - 0.1*inch)

    # Table Content
    p.setFont("Helvetica", 10)
    y_position = header_y - 0.4*inch
    line_height = 0.3*inch
    
    # Fetch attendance details again here, ensuring consistency with total_hours_at_generation
    # Ideally, the certificate generation logic should pass these details to avoid redundant queries.
    attendances = Attendance.objects.filter(
        participant=certificate.participant,
        check_in_time__isnull=False,
        check_out_time__isnull=False,
        # Add filter if certificate is tied to specific events or date range
        # check_in_time__date__lte=certificate.issue_date 
    ).select_related("event").values(
        "event__name"
    ).annotate(
        hours=Sum("calculated_hours")
    ).order_by("event__name")

    for item in attendances:
        if y_position < 1.5*inch: # Check if space is left, create new page if needed
            p.showPage()
            p.setFont("Helvetica-Bold", 16) # Redraw header on new page if needed
            p.drawCentredString(width / 2.0, height - 1.5*inch, "DETALHAMENTO DE PARTICIPAÇÃO (cont.)")
            header_y = height - 2.5*inch
            p.setFont("Helvetica-Bold", 11)
            p.drawString(inch, header_y, "Evento")
            p.drawString(width - 2*inch, header_y, "Horas")
            p.line(inch, header_y - 0.1*inch, width - inch, header_y - 0.1*inch)
            p.setFont("Helvetica", 10)
            y_position = header_y - 0.4*inch # Reset Y for new page
        
        # Use Paragraph for potential text wrapping if event names are long
        event_name_paragraph = Paragraph(item["event__name"], style_normal)
        event_name_paragraph.wrapOn(p, width - 3.5*inch, line_height) # Adjust width as needed
        event_name_paragraph.drawOn(p, inch, y_position - event_name_paragraph.height + 0.1*inch) # Adjust vertical position

        p.drawString(width - 2*inch, y_position, f"{item["hours"]:.2f}")
        y_position -= max(line_height, event_name_paragraph.height + 0.1*inch) # Move down by paragraph height or min line height

    p.save()
    # PDF generation is complete, buffer contains the data

# --- Example Usage in Views (Simplified) --- 
# from django.http import HttpResponse
# from .utils import generate_certificate_pdf
# from .models import Certificate
# import io
# 
# def download_certificate_view(request, certificate_id):
#     try:
#         certificate = Certificate.objects.get(pk=certificate_id)
#         # Check permissions
#         if certificate.participant != request.user and not request.user.is_staff:
#             return HttpResponse("Forbidden", status=403)
# 
#         buffer = io.BytesIO()
#         generate_certificate_pdf(buffer, certificate)
#         buffer.seek(0)
# 
#         response = HttpResponse(buffer, content_type=\"application/pdf\")
#         response[\"Content-Disposition\"] = f\"attachment; filename=certificado_{certificate.unique_code}.pdf\"
#         return response
# 
#     except Certificate.DoesNotExist:
#         return HttpResponse("Not Found", status=404)


