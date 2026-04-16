import os
import uuid
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm

# A4 Landscape: 841.89 x 595.27 points
PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

async def generate_certificate(user_data: dict, session_data: dict, course_title: str) -> dict:
    certificate_id = str(uuid.uuid4()).upper()[:13]
    file_name = f"certificate_{certificate_id}.pdf"
    
    cert_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "certificates")
    os.makedirs(cert_dir, exist_ok=True)
    
    file_path = os.path.join(cert_dir, file_name)
    
    # Create canvas
    c = canvas.Canvas(file_path, pagesize=landscape(A4))
    
    # --- COLORS ---
    brand_primary = HexColor('#0f172a') # Dark Slate
    brand_accent = HexColor('#c2410c')  # Orange/Gold
    brand_subtle = HexColor('#f8fafc')  # White/Gray
    text_muted = HexColor('#64748b')
    
    # --- 1. SOLID BACKGROUND ---
    c.setFillColor(brand_subtle)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    # --- 2. DECORATIVE SIDEBAR (GRADIENT EFFECT) ---
    c.setFillColor(brand_primary)
    c.rect(0, 0, 40, PAGE_HEIGHT, fill=1, stroke=0)
    
    # Accent stripe on the sidebar
    c.setFillColor(brand_accent)
    c.rect(34, 0, 6, PAGE_HEIGHT, fill=1, stroke=0)
    
    # --- 3. BORDERS ---
    c.setStrokeColor(brand_primary)
    c.setLineWidth(1)
    c.rect(20, 20, PAGE_WIDTH - 40, PAGE_HEIGHT - 40, fill=0, stroke=1)
    
    # --- 4. HEADER ---
    # Logo Text
    c.setFillColor(brand_primary)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(60, PAGE_HEIGHT - 60, "INTERNIXA")
    
    c.setFillColor(brand_accent)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(170, PAGE_HEIGHT - 60, "EDUCATIONAL PORTAL")
    
    # Main Title
    c.setFillColor(brand_primary)
    c.setFont("Helvetica-Bold", 50)
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 160, "CERTIFICATE")
    
    c.setFillColor(brand_accent)
    c.setFont("Helvetica", 20)
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 195, "OF EXCELLENCE & COMPLETION")
    
    # --- 5. BODY TEXT ---
    c.setFillColor(text_muted)
    c.setFont("Helvetica-Oblique", 16)
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 260, "This high-honor credential is proudfully presented to")
    
    # Recipient Name
    c.setFillColor(brand_primary)
    c.setFont("Helvetica-Bold", 44)
    name = str(user_data.get("name", "Valued Student")).upper()
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 320, name)
    
    # Decorative line under name
    c.setStrokeColor(brand_accent)
    c.setLineWidth(1.5)
    c.line(PAGE_WIDTH/2 - 150, PAGE_HEIGHT - 335, PAGE_WIDTH/2 + 190, PAGE_HEIGHT - 335)
    
    # Description
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 14)
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 375, "For successfully completing the AI-monitored professional module:")
    
    c.setFillColor(brand_primary)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 415, course_title or "Professional Training")
    
    # --- 6. STATS / VERIFICATION ---
    c.setFillColor(brand_subtle)
    c.rect(PAGE_WIDTH/2 - 180, PAGE_HEIGHT - 480, 400, 40, fill=1, stroke=0)
    
    c.setFillColor(brand_primary)
    c.setFont("Helvetica-Bold", 10)
    score = session_data.get("engagementScore", 100)
    duration = round(session_data.get("totalTime", 0) / 60)
    stats_text = f"ENGAGEMENT SCORE: {score}%  |  DURATION: {duration} MINS  |  STATUS: VERIFIED"
    c.drawCentredString(PAGE_WIDTH / 2 + 20, PAGE_HEIGHT - 465, stats_text)
    
    # --- 7. FOOTER & SIGNATURES ---
    footer_y = 70
    
    # Left: AI Seal
    c.setStrokeColor(brand_accent)
    c.setLineWidth(2)
    c.circle(120, footer_y + 40, 35, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(brand_accent)
    c.drawCentredString(120, footer_y + 45, "VALIDATED")
    c.drawCentredString(120, footer_y + 35, "AI AGENT")
    
    # Center: Signature
    c.setStrokeColor(brand_primary)
    c.setLineWidth(0.5)
    c.line(PAGE_WIDTH/2 - 80, footer_y + 30, PAGE_WIDTH/2 + 120, footer_y + 30)
    c.setFillColor(brand_primary)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_WIDTH/2 + 20, footer_y + 15, "Official AI Oversight Representative")
    
    # Right: Date
    c.line(PAGE_WIDTH - 250, footer_y + 30, PAGE_WIDTH - 80, footer_y + 30)
    date_str = datetime.now().strftime("%B %d, %Y")
    c.drawCentredString(PAGE_WIDTH - 165, footer_y + 15, f"ISSUE DATE: {date_str}")
    
    # ID at bottom
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 7)
    c.drawCentredString(PAGE_WIDTH / 2 + 20, 25, f"VERIFICATION HASH: {certificate_id}")
    
    # Finalize
    c.showPage()
    c.save()
    
    return {
        "certificateId": certificate_id,
        "filePath": file_path,
        "fileName": file_name
    }
