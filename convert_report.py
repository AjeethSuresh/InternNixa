import os
import re
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def convert_md_to_pdf(md_file, pdf_file):
    if not os.path.exists(md_file):
        print(f"Error: {md_file} not found.")
        return

    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by slide marker (---)
    slides = re.split(r'\n---\n', content)
    
    # Clean up the introduction part from the first slide if needed
    if '# INTERNIXA' in slides[0]:
        slides[0] = slides[0].replace('# INTERNIXA: AI-Monitored Learning Platform\n## Project Report & Presentation (10-Slide Structure)\n', '')

    c = canvas.Canvas(pdf_file, pagesize=landscape(A4))
    width, height = landscape(A4)

    # Colors
    navy = HexColor('#1e293b')
    gold = HexColor('#c2410c')
    text_main = HexColor('#334155')
    text_muted = HexColor('#64748b')

    for i, slide in enumerate(slides):
        # Draw Background
        c.setFillColor(HexColor('#f8fafc'))
        c.rect(0, 0, width, height, fill=1, stroke=0)
        
        # Draw Header Bar
        c.setFillColor(navy)
        c.rect(0, height - 60, width, 60, fill=1, stroke=0)
        
        # Slide Number
        c.setFillColor(HexColor('#ffffff'))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(width - 80, height - 35, f"SLIDE {i+1}")
        
        # "INTERNIXA" Brand
        c.setFont("Helvetica-Bold", 20)
        c.drawString(40, height - 38, "INTERNIXA")

        # Process Content
        lines = slide.strip().split('\n')
        y_pos = height - 100
        
        for line in lines:
            line = line.strip()
            if not line:
                y_pos -= 10
                continue
                
            if line.startswith('###'):
                # Slide Title
                title = line.replace('###', '').strip()
                c.setFillColor(gold)
                c.setFont("Helvetica-Bold", 32)
                c.drawCentredString(width / 2, y_pos - 20, title)
                y_pos -= 80
            elif line.startswith('**') and ':' in line:
                # Key: Value or Subtitle
                parts = line.split(':', 1)
                key = parts[0].replace('**', '').strip()
                val = parts[1].strip()
                
                c.setFillColor(navy)
                c.setFont("Helvetica-Bold", 16)
                c.drawString(60, y_pos, key + ":")
                
                c.setFillColor(text_main)
                c.setFont("Helvetica", 16)
                text_width = c.stringWidth(key + ": ", "Helvetica-Bold", 16)
                c.drawString(60 + text_width, y_pos, val)
                y_pos -= 30
            elif line.startswith('- '):
                # Bullet Points
                text = line.replace('- ', '').replace('**', '').strip()
                c.setFillColor(gold)
                c.circle(75, y_pos + 4, 3, fill=1, stroke=0)
                c.setFillColor(text_main)
                c.setFont("Helvetica", 14)
                
                # Simple text wrapping logic
                if len(text) > 90:
                    c.drawString(90, y_pos, text[:90] + "...")
                else:
                    c.drawString(90, y_pos, text)
                y_pos -= 25
            elif line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. ') or line.startswith('4. '):
                # Numbered list
                text = line[3:].replace('**', '').strip()
                c.setFillColor(navy)
                c.setFont("Helvetica-Bold", 14)
                c.drawString(70, y_pos, line[:3])
                c.setFillColor(text_main)
                c.setFont("Helvetica", 14)
                c.drawString(95, y_pos, text)
                y_pos -= 25
            else:
                # Normal Text
                c.setFillColor(text_main)
                c.setFont("Helvetica", 14)
                # Word wrap for long paragraphs
                words = line.split(' ')
                current_line = ""
                for word in words:
                    if c.stringWidth(current_line + word, "Helvetica", 14) < width - 120:
                        current_line += word + " "
                    else:
                        c.drawString(60, y_pos, current_line)
                        y_pos -= 20
                        current_line = word + " "
                c.drawString(60, y_pos, current_line)
                y_pos -= 30

        # Footer
        c.setFillColor(text_muted)
        c.setFont("Helvetica", 8)
        c.drawCentredString(width / 2, 20, "InternNixa Project Report | Proprietary & Confidential")
        
        c.showPage()

    c.save()
    print(f"Successfully generated {pdf_file}")

if __name__ == "__main__":
    convert_md_to_pdf(r'd:\INTERNIXA\InternNixa\PROJECT_REPORT.md', r'd:\INTERNIXA\InternNixa\PROJECT_REPORT.pdf')
