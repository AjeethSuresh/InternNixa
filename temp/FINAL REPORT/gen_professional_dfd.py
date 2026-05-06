import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle

OUT = os.path.join(os.path.dirname(__file__), "image_folder")
os.makedirs(OUT, exist_ok=True)

C_LBLUE = "#F0F9FF"; C_IND = "#1E3A8A"; C_TXT = "#1E293B"; C_BG = "#FFFFFF"
C_LGRAY = "#F8FAFC"; C_ORNG = "#FFFBEB"

def save(name): plt.savefig(os.path.join(OUT, name), dpi=300, bbox_inches='tight', facecolor=C_BG)

def gs_proc(ax, x, y, w, h, id, txt):
    """Gane-Sarson Process Node"""
    # Main box
    ax.add_patch(FancyBboxPatch((x,y), w, h, boxstyle="round,pad=0.02", fc=C_LBLUE, ec=C_IND, lw=1.5))
    # Top header line
    ax.plot([x, x+w], [y+h*0.7, y+h*0.7], color=C_IND, lw=1.0)
    # ID
    ax.text(x+w/2, y+h*0.85, id, ha='center', va='center', fontsize=8, fontweight='bold')
    # Label
    ax.text(x+w/2, y+h*0.35, txt, ha='center', va='center', fontsize=8, fontweight='bold', wrap=True)

def entity(ax, x, y, w, h, txt):
    """External Entity"""
    ax.add_patch(Rectangle((x,y), w, h, fc=C_LGRAY, ec=C_IND, lw=2))
    ax.text(x+w/2, y+h/2, txt, ha='center', va='center', fontsize=9, fontweight='bold')

def store(ax, x, y, w, h, id, txt):
    """Data Store"""
    ax.plot([x, x+w], [y, y], color=C_IND, lw=1.5)
    ax.plot([x, x+w], [y+h, y+h], color=C_IND, lw=1.5)
    ax.plot([x+0.5, x+0.5], [y, y+h], color=C_IND, lw=1.0)
    ax.text(x+0.25, y+h/2, id, ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(x+w/2+0.25, y+h/2, txt, ha='center', va='center', fontsize=8)

def arrow(ax, s, e, lbl="", rad=0):
    ap = dict(arrowstyle="-|>", color=C_IND, connectionstyle=f"arc3,rad={rad}", lw=1.2)
    ax.annotate("", xy=e, xytext=s, arrowprops=ap)
    if lbl:
        mx, my = (s[0]+e[0])/2, (s[1]+e[1])/2
        ax.text(mx, my+0.1, lbl, fontsize=7, color=C_IND, ha='center', rotation=0)

# ── Fig 3.4  Professional DFD Level 1 ────────────────────────────────────────
fig, ax = plt.subplots(figsize=(15, 10)); ax.set_xlim(0, 15); ax.set_ylim(0, 10); ax.axis('off')
ax.set_title("Data Flow Diagram Level 1 – Internixa Intelligence Ecosystem", fontsize=16, fontweight='bold', pad=20)

# Entities
entity(ax, 0.5, 8.0, 2.0, 1.0, "STUDENT")
entity(ax, 12.5, 8.0, 2.0, 1.0, "RECRUITER")
entity(ax, 12.5, 4.5, 2.0, 1.0, "GEMINI AI\nSERVICE")

# Processes
gs_proc(ax, 4.0, 8.0, 2.5, 1.2, "1.0", "Identity & Access\nManagement")
gs_proc(ax, 8.0, 8.0, 2.5, 1.2, "2.0", "Adaptive Course\nEngine")
gs_proc(ax, 8.0, 5.0, 2.5, 1.2, "3.0", "AI Attention\nMonitoring")
gs_proc(ax, 4.0, 5.0, 2.5, 1.2, "4.0", "RAG Intelligence\n(ChatBot)")
gs_proc(ax, 4.0, 2.0, 2.5, 1.2, "5.0", "Real-time\nCollaboration")
gs_proc(ax, 8.0, 2.0, 2.5, 1.2, "6.0", "Competency &\nReward Engine")

# Data Stores
store(ax, 4.0, 0.2, 3.0, 0.8, "D1", "MongoDB (User Profiles)")
store(ax, 8.0, 0.2, 3.0, 0.8, "D2", "Pinecone (Course Vectors)")

# Flows
arrow(ax, (2.5, 8.5), (4.0, 8.5), "Credentials")
arrow(ax, (6.5, 8.5), (8.0, 8.5), "Auth Token")
arrow(ax, (9.25, 8.0), (9.25, 6.2), "Module Stream")
arrow(ax, (1.5, 8.0), (1.5, 2.6), "Join Meeting", rad=-0.2)
arrow(ax, (8.0, 5.6), (6.5, 5.6), "Distraction Event")
arrow(ax, (4.0, 5.6), (3.0, 8.0), "AI Answer", rad=0.2)
arrow(ax, (9.25, 5.0), (9.25, 3.2), "Focus Metrics")
arrow(ax, (12.5, 8.5), (10.5, 8.5), "Talent Inquiry")
arrow(ax, (12.5, 5.0), (10.5, 5.3), "Context")
arrow(ax, (5.25, 2.0), (5.25, 1.0), "Meeting Logs")
arrow(ax, (9.25, 2.0), (9.25, 1.0), "Course Metadata")

save("internixa_dfd1_pro.png"); plt.close()
print("Professional DFD Level 1 Generated.")
