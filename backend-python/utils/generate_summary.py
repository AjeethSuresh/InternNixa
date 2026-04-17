import os
import datetime
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def generate_smart_summary(user_name, course_title, module_title, engagement_score, duration_sec):
    # Initialize Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY not set")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Generate content with prompt
    prompt = f"""
    Create a professional, structured learning summary for a student on the Internixa platform.
    
    Student: {user_name}
    Course: {course_title}
    Module: {module_title}
    Focus Score: {engagement_score}%
    Watch Time: {duration_sec}s
    
    Requirements:
    1. Write a 300-400 word detailed session summary of what is usually covered in a module titled "{module_title}".
    2. Provide a "Key Technical Terms" section with 5 terms and definitions.
    3. Generate 3 "Deep Focus Timestamps" (e.g., 04:30 - Topic Name) spread across the duration of {duration_sec} seconds.
    4. Format the response with clear headers.
    """
    
    try:
        response = model.generate_content(prompt)
        ai_text = response.text
    except Exception as e:
        ai_text = f"Session summary for {module_title}. Key topics included the core fundamentals of {course_title}."
    
    # Generate PDF
    filename = f"Summary_{user_name.replace(' ', '_')}_{int(datetime.datetime.now().timestamp())}.pdf"
    file_path = os.path.join("summaries", filename)
    os.makedirs("summaries", exist_ok=True)
    
    doc = SimpleDocTemplate(file_path, pagesize=LETTER)
    styles = getSampleStyleSheet()
    story = []
    
    # Header
    story.append(Paragraph(f"INTERNIXA: Smart Study Sheet", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Metadata Table
    data = [
        ["Student", user_name],
        ["Course", course_title],
        ["Module", module_title],
        ["Focus Score", f"{engagement_score}%"],
        ["Date", datetime.datetime.now().strftime("%Y-%m-%d")]
    ]
    t = Table(data, colWidths=[100, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 24))
    
    # Body Content
    # We'll split the AI text by double newlines or headers to make paragraphs
    paragraphs = ai_text.split('\n')
    for p in paragraphs:
        if p.strip():
            if '**' in p or p.isupper() or p.startswith('#'):
                story.append(Paragraph(p.replace('*', ''), styles['Heading2']))
            else:
                story.append(Paragraph(p, styles['BodyText']))
            story.append(Spacer(1, 8))
            
    # Footer
    story.append(Spacer(1, 36))
    story.append(Paragraph("This document was generated automatically by Internixa AI based on your real-time engagement data.", styles['Italic']))
    
    doc.build(story)
    
    return {"fileName": filename, "filePath": file_path}
