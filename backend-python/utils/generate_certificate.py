import os
import uuid
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

# A4 Landscape: 841.89 x 595.27 points
PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

async def generate_certificate(user_data: dict, session_data: dict, course_title: str) -> dict:
    certificate_id = str(uuid.uuid4())
    file_name = f"certificate_{certificate_id}.pdf"
    
    cert_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "certificates")
    os.makedirs(cert_dir, exist_ok=True)
    
    file_path = os.path.join(cert_dir, file_name)
    
    c = canvas.Canvas(file_path, pagesize=landscape(A4))
    
    # --- COLORS ---
    navy = HexColor('#1e293b')
    gold = HexColor('#c2410c')
    light_gray = HexColor('#f8fafc')
    text_main = HexColor('#334155')
    
    # --- BACKGROUND & BORDERS ---
    c.setFillColor(light_gray)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    # Main thick border (Navy)
    c.setStrokeColor(navy)
    c.setLineWidth(15)
    c.rect(20, 20, PAGE_WIDTH - 40, PAGE_HEIGHT - 40, fill=0, stroke=1)
    
    # Inner thin border (Gold)
    c.setStrokeColor(gold)
    c.setLineWidth(2)
    c.rect(45, 45, PAGE_WIDTH - 90, PAGE_HEIGHT - 90, fill=0, stroke=1)
    
    # --- CORNER ACCENTS ---
    c.setFillColor(navy)
    c.rect(20, 20, 60, 60, fill=1, stroke=0)
    c.rect(PAGE_WIDTH - 80, 20, 60, 60, fill=1, stroke=0)
    c.rect(20, PAGE_HEIGHT - 80, 60, 60, fill=1, stroke=0)
    c.rect(PAGE_WIDTH - 80, PAGE_HEIGHT - 80, 60, 60, fill=1, stroke=0)
    
    # --- CONTENT ---
    # INTERNIXA Brand
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(65, PAGE_HEIGHT - 70, "INTERNIXA")
    
    # Decorative accent line for brand
    c.setStrokeColor(gold)
    c.setLineWidth(2)
    c.line(60, PAGE_HEIGHT - 75, 160, PAGE_HEIGHT - 75)

    # Certificate Header
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 45)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 130, "CERTIFICATE")
    
    c.setFillColor(gold)
    c.setFont("Helvetica", 18)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 165, "OF COMPLETION")
    
    c.setFillColor(text_main)
    c.setFont("Helvetica-Oblique", 16)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 220, "This serves to acknowledge that")
    
    # Candidate Name
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 42)
    name = str(user_data.get("name", "Student")).upper()
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 290, name)
    
    # Line under name
    c.setStrokeColor(gold)
    c.setLineWidth(1)
    c.line(PAGE_WIDTH / 4, PAGE_HEIGHT - 310, (PAGE_WIDTH / 4) * 3, PAGE_HEIGHT - 310)
    
    # Course info
    c.setFillColor(text_main)
    c.setFont("Helvetica", 16)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 360, "has successfully demonstrated proficiency in")
    
    c.setFillColor(gold)
    c.setFont("Helvetica-Bold", 26)
    course_name = course_title if course_title else 'Professional AI-Monitored Training'
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 410, course_name)
    
    # Engagement Stats
    c.setFillColor(text_main)
    c.setFont("Helvetica", 14)
    total_time_mins = round(session_data.get("totalTime", 0) / 60)
    score = session_data.get("engagementScore", 0)
    stats_text = f"Engagement Score: {score}% | Total Duration: {total_time_mins} Minutes"
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 450, stats_text)
    
    # --- FOOTER ---
    footer_y = 60
    
    # Signature Area (Left)
    c.setStrokeColor(navy)
    c.setLineWidth(1)
    c.line(150, footer_y + 30, 350, footer_y + 30)
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(250, footer_y + 15, "AI VERIFICATION SYSTEM")
    
    # Date Area (Right)
    # Right-side line from PAGE_WIDTH-350 to PAGE_WIDTH-150
    c.line(PAGE_WIDTH - 350, footer_y + 30, PAGE_WIDTH - 150, footer_y + 30)
    today_str = datetime.now().strftime("%m/%d/%Y")
    c.drawCentredString(PAGE_WIDTH - 250, footer_y + 15, f"DATE: {today_str}")
    
    # Digital Seal (Bottom Right corner area)
    seal_x = PAGE_WIDTH - 120
    seal_y = 120
    
    c.setStrokeColor(gold)
    c.setLineWidth(3)
    c.circle(seal_x, seal_y, 40, fill=0, stroke=1)
    
    # Draw dashed circle manually (ReportLab doesn't have a simple built-in dashed circle)
    c.setLineWidth(1)
    c.setDash(5, 2)
    c.circle(seal_x, seal_y, 35, fill=0, stroke=1)
    c.setDash() # reset dash
    
    c.setFillColor(gold)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(seal_x, seal_y + 4, "VERIFIED")
    c.drawCentredString(seal_x, seal_y - 6, "AI PASS")
    
    # Verification ID at very bottom
    c.setFillColor(HexColor('#94a3b8'))
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH / 2, 30, f"Verification ID: {certificate_id}")
    
    c.save()
    
    return {
        "certificateId": certificate_id,
        "filePath": file_path,
        "fileName": file_name
    }
