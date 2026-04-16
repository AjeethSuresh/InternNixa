import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black, lightgrey
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

def generate_20_page_pdf(md_path, pdf_path):
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], fontSize=28, textColor=HexColor('#1e293b'), 
        alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle', parent=styles['Normal'], fontSize=16, textColor=HexColor('#c2410c'), 
        alignment=TA_CENTER, spaceAfter=40, fontName='Helvetica'
    )
    h2_style = ParagraphStyle(
        'H2Style', parent=styles['Heading2'], fontSize=18, textColor=HexColor('#1e293b'), 
        spaceBefore=15, spaceAfter=10, borderPadding=5, fontName='Helvetica-Bold'
    )
    h3_style = ParagraphStyle(
        'H3Style', parent=styles['Heading3'], fontSize=14, textColor=HexColor('#c2410c'), 
        spaceBefore=10, spaceAfter=5, fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'BodyStyle', parent=styles['Normal'], fontSize=11, leading=16, 
        alignment=TA_JUSTIFY, spaceAfter=10, fontName='Helvetica'
    )
    code_style = ParagraphStyle(
        'CodeStyle', parent=styles['Normal'], fontSize=9, fontName='Courier', 
        leftIndent=20, textColor=HexColor('#334155'), spaceAfter=10
    )

    story = []

    # --- PAGE 1: COVER PAGE ---
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("INTERNIXA: THE COMPLETE TECHNICAL SPECIFICATION", title_style))
    story.append(Paragraph("AI-Monitored Learning & Knowledge Retrieval Platform", subtitle_style))
    story.append(Spacer(1, 1 * inch))
    story.append(Paragraph("Empowering Online Education with Real-Time Accountability", ParagraphStyle('Sub', alignment=TA_CENTER, fontSize=12)))
    story.append(Spacer(1, 4 * inch))
    story.append(Paragraph("Developer: Ajeeth S | Internixa Research Lab", ParagraphStyle('Dev', alignment=TA_CENTER, fontSize=10)))
    story.append(Paragraph("April 2026", ParagraphStyle('Date', alignment=TA_CENTER, fontSize=10)))
    story.append(PageBreak())

    # --- PAGE 2: TABLE OF CONTENTS ---
    story.append(Paragraph("Table of Contents", h2_style))
    toc_items = [
        "1. Executive Summary",
        "2. The Evolution of E-Learning",
        "3. Core System Objectives",
        "4. Detailed Technical Stack Breakdown",
        "5. AI Monitoring Methodology (Landmarks, EAR, Gaze)",
        "6. Generative AI & RAG (Retrieval-Augmented Generation)",
        "7. Implementation Deep-Dive (Frontend/Backend)",
        "8. Security Puzzles & Integrity Gates",
        "9. Performance Analytics & Scoring",
        "10. Database Schema Documentation",
        "11. API Endpoint Documentation",
        "12. Project Directory Structure",
        "13. AI Model Landmark Registry",
        "14. UI Component & Design System",
        "15. Deployment & Production Guide",
        "16. Conclusion",
        "17. Appendices & References"
    ]
    for item in toc_items:
        story.append(Paragraph(item, body_style))
    story.append(PageBreak())

    # --- CONTENT PROCESSING ---
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = content.split('---')
    for section in sections:
        lines = section.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if line.startswith('# '):
                story.append(Paragraph(line[2:], title_style))
            elif line.startswith('## '):
                story.append(Paragraph(line[3:], h2_style))
            elif line.startswith('### '):
                story.append(Paragraph(line[4:], h3_style))
            elif line.startswith('$$') or '$' in line:
                eq = line.replace('$', '')
                story.append(Paragraph(f"<b>EQUATION:</b> {eq}", ParagraphStyle('Eq', alignment=TA_CENTER, fontSize=11, fontName='Helvetica-Oblique', spaceBefore=10, spaceAfter=10)))
            elif line.startswith('- '):
                story.append(Paragraph(f"• {line[2:]}", body_style))
            else:
                story.append(Paragraph(line, body_style))
        story.append(PageBreak())

    # --- ANNEX SECTIONS ---
    
    # 10. DATABASE SCHEMA
    story.append(Paragraph("10. Database Schema Documentation", h2_style))
    schemas = [
        ["Collection", "Fields", "Description"],
        ["users", "email, password, name, role", "User credentials and profiles"],
        ["enrollments", "userId, courseId, completedModules", "Student progress tracking"],
        ["sessions", "userId, moduleId, activeTime, focusRate", "Raw engagement telemetry"],
        ["certificates", "uuid, userId, issueDate, verificationUrl", "Verified credentials"],
        ["courses", "title, description, modules, videos", "Curriculum structure"]
    ]
    t = Table(schemas, colWidths=[1.2*inch, 2.5*inch, 2.3*inch])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')), ('TEXTCOLOR', (0,0), (-1,0), white)]))
    story.append(t)
    story.append(PageBreak())

    # 11. API DOCUMENTATION
    story.append(Paragraph("11. API Endpoint Documentation", h2_style))
    # Expansion
    endpoints = [
        ("POST /api/auth/login", "Standard login flow. Returns Bearer token."),
        ("POST /api/auth/register", "Onboards new students to the platform."),
        ("GET /api/courses", "Returns available video courses and metadata."),
        ("GET /api/courses/{id}", "Detailed view of course modules."),
        ("POST /api/session/complete", "Calculates engagement scores and saves progress."),
        ("POST /api/chatbot/chat", "RAG Pipeline: Search -> Augment -> Generate."),
        ("GET /api/user/profile", "Profile Management and session history."),
        ("POST /api/user/settings", "Update camera and visibility preferences.")
    ]
    for endpoint, desc in endpoints:
        story.append(Paragraph(f"<b>{endpoint}</b>", h3_style))
        story.append(Paragraph(desc, body_style))
    story.append(PageBreak())

    # 14. UI COMPONENT & DESIGN SYSTEM
    story.append(Paragraph("14. UI Component & Design System", h2_style))
    story.append(Paragraph("INTERNIXA utilizes a modular design system for consistent UX.", h3_style))
    design_tokens = [
        ["Attribute", "Value", "Usage"],
        ["Primary Color", "#06b6d4 (Cyan 500)", "Brand identity and main actions"],
        ["Accent Color", "#c2410c (Orange 700)", "Status indicators and focus states"],
        ["Background", "#0f172a (Slate 900)", "App shell and dark mode base"],
        ["Border Radius", "1.5rem / 24px", "Modern, rounded UI feel"],
        ["Blur Type", "Backdrop Filter 12px", "Glassmorphism implementation"]
    ]
    dt = Table(design_tokens, colWidths=[1.5*inch, 2*inch, 2.5*inch])
    dt.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), HexColor('#06b6d4')), ('TEXTCOLOR', (0,0), (-1,0), white)]))
    story.append(dt)
    story.append(PageBreak())

    # 15. DEPLOYMENT GUIDE
    story.append(Paragraph("15. Deployment & Production Guide", h2_style))
    story.append(Paragraph("Steps for deploying the Internixa stack to cloud environments.", h3_style))
    story.append(Paragraph("1. Frontend: Deploying to Vercel/Netlify using Vite build pipeline.", body_style))
    story.append(Paragraph("2. Backend: Containerization using Docker for high availability.", body_style))
    story.append(Paragraph("3. Database: Cluster setup for MongoDB and region-specific Pinecone indexes.", body_style))
    story.append(Paragraph("4. SSL: Mandatory HTTPS for Camera/MediaPipe API access.", body_style))
    story.append(PageBreak())

    # Bibliography
    story.append(Paragraph("17. References & Bibliography", h2_style))
    refs = [
        "1. Google Research: MediaPipe Face Mesh (2020).",
        "2. Soukupova, T. & Cech, J. 'Eye Aspect Ratio for Drowsiness Detection' (2016).",
        "3. Vaswani et al. 'Attention Is All You Need' (Transformer Architecture).",
        "4. React 19 Concurrent Rendering Documentation.",
        "5. Pinecone Vector Database Architecture Review.",
        "6. FastAPI Documentation - High-performance Python APIs."
    ]
    for r in refs: story.append(Paragraph(r, body_style))

    doc.build(story)
    print(f"Full 20-Page Report saved to: {pdf_path}")

if __name__ == "__main__":
    generate_20_page_pdf("FULL_TECHNICAL_REPORT.md", "INTERNIXA_FULL_TECHNICAL_REPORT.pdf")
