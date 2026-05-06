import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle

OUT = os.path.join(os.path.dirname(__file__), "image_folder")
os.makedirs(OUT, exist_ok=True)

# Theme Colors
C_BLUE = "#3B82F6"; C_LBLUE = "#EFF6FF"
C_PURP = "#8B5CF6"; C_LPURP = "#F5F3FF"
C_EMER = "#10B981"; C_LEMER = "#ECFDF5"
C_ORNG = "#F59E0B"; C_LORNG = "#FFFBEB"
C_RED  = "#EF4444"; C_LRED  = "#FEF2F2"
C_TEXT = "#1E293B"; C_IND  = "#1E3A8A"; C_LGRY = "#F8FAFC"
C_BG   = "#FFFFFF"

def save(name): plt.savefig(os.path.join(OUT, name), dpi=300, bbox_inches='tight', facecolor=C_BG)

def box(ax, x, y, w, h, txt, fc, ec=C_IND, fs=9, bold=True):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle="round,pad=0.04",facecolor=fc,edgecolor=ec,linewidth=1.5))
    ax.text(x+w/2,y+h/2,txt,ha='center',va='center',fontsize=fs,color=C_TEXT,fontweight='bold' if bold else 'normal',wrap=True)

def arrow(ax, x1, y1, x2, y2, lbl=""):
    ax.annotate("",xy=(x2,y2),xytext=(x1,y1),arrowprops=dict(arrowstyle="-|>",color=C_IND,lw=1.5))
    if lbl: ax.text((x1+x2)/2, (y1+y2)/2+0.1, lbl, fontsize=7, color=C_IND, ha='center')

# ── 1. Internixa Platform Architecture ───────────────────────────────────────
fig,ax = plt.subplots(figsize=(10,7)); ax.set_xlim(0,10); ax.set_ylim(0,7); ax.axis('off')
ax.set_title("Internixa System Architecture", fontsize=14, fontweight='bold', pad=20)

# Layers
box(ax, 0.5, 5.8, 9.0, 0.8, "USER INTERFACE LAYER\n(React 19 + Tailwind CSS + Framer Motion)", C_LBLUE)
box(ax, 0.5, 4.2, 4.0, 1.2, "AI MONITORING ENGINE\n(MediaPipe Face Mesh + EAR Algorithm)", C_LPURP)
box(ax, 5.5, 4.2, 4.0, 1.2, "REAL-TIME COMMUNICATION\n(WebRTC + Socket.IO Signaling)", C_LEMER)
box(ax, 0.5, 2.2, 9.0, 1.2, "BACKEND API SERVICES (FastAPI)\nJWT Auth | RAG Pipeline | Gemini LLM | Certificate Gen (ReportLab)", C_LORNG)
box(ax, 0.5, 0.5, 4.0, 1.0, "PRIMARY DATA STORE\n(MongoDB Atlas)", C_LRED)
box(ax, 5.5, 0.5, 4.0, 1.0, "VECTOR SEARCH ENGINE\n(Pinecone DB)", C_LRED)

# Connectors
arrow(ax, 5.0, 5.8, 5.0, 5.4) # UI to Engine
arrow(ax, 2.5, 4.2, 2.5, 3.4) # AI to Backend
arrow(ax, 7.5, 4.2, 7.5, 3.4) # WebRTC to Backend
arrow(ax, 2.5, 2.2, 2.5, 1.5) # Backend to Mongo
arrow(ax, 7.5, 2.2, 7.5, 1.5) # Backend to Pinecone

save("internixa_architecture.png"); plt.close()

# ── 2. ER Diagram ────────────────────────────────────────────────────────────
fig,ax = plt.subplots(figsize=(12,8)); ax.set_xlim(0,12); ax.set_ylim(0,8); ax.axis('off')
ax.set_title("Internixa Entity Relationship Diagram (ERD)", fontsize=14, fontweight='bold')

def ent(ax, x, y, w, h, title, attrs):
    box(ax, x, y, w, h, title, C_LBLUE)
    attr_txt = "\n".join(attrs)
    ax.text(x+w/2, y-0.2, attr_txt, ha='center', va='top', fontsize=7, color=C_TEXT)

ent(ax, 0.5, 6.0, 2.0, 0.6, "USER", ["_id (PK)", "name", "email", "password_hash", "role", "fp_total"])
ent(ax, 4.5, 6.0, 2.0, 0.6, "COURSE", ["_id (PK)", "title", "video_url", "transcript", "recruiter_id (FK)"])
ent(ax, 8.5, 6.0, 2.0, 0.6, "SESSION", ["_id (PK)", "user_id (FK)", "course_id (FK)", "score", "active_time"])
ent(ax, 4.5, 3.0, 2.2, 0.6, "CERTIFICATE", ["_id (PK)", "user_id (FK)", "course_id (FK)", "verify_id"])
ent(ax, 8.5, 3.0, 2.0, 0.6, "MEETING", ["_id (PK)", "room_id", "host_id (FK)", "started_at"])

# Relationships
def rel(ax, x, y, txt):
    ax.add_patch(plt.Polygon([[x,y+0.3], [x+0.5,y], [x,y-0.3], [x-0.5,y]], closed=True, fc=C_BG, ec=C_IND))
    ax.text(x, y, txt, ha='center', va='center', fontsize=6, fontweight='bold')

rel(ax, 3.5, 6.3, "Enrolls")
rel(ax, 7.5, 6.3, "Completes")
rel(ax, 5.5, 4.8, "Generates")
rel(ax, 1.5, 3.3, "Earns")

arrow(ax, 2.5, 6.3, 3.0, 6.3); arrow(ax, 4.0, 6.3, 4.5, 6.3) # User enrolls Course
arrow(ax, 6.5, 6.3, 7.0, 6.3); arrow(ax, 8.0, 6.3, 8.5, 6.3) # Course completes Session
arrow(ax, 9.5, 5.0, 9.5, 3.6) # Session generates Meeting? No, user earns cert
arrow(ax, 5.5, 6.0, 5.5, 5.1); arrow(ax, 5.5, 4.5, 5.5, 3.6) # Course to Cert
arrow(ax, 1.5, 6.0, 1.5, 3.6) # User to Cert link

save("internixa_erd.png"); plt.close()

# ── 3. DFD Level 0 (Context Diagram) ─────────────────────────────────────────
fig,ax = plt.subplots(figsize=(8,6)); ax.set_xlim(0,8); ax.set_ylim(0,6); ax.axis('off')
ax.set_title("Fig 3.3 – DFD Level 0 (Internixa Context Diagram)", fontsize=12, fontweight='bold')

# Central Process
circ = Circle((4,3), 1.2, fc=C_LBLUE, ec=C_IND, lw=2)
ax.add_patch(circ)
ax.text(4, 3, "INTERNIXA\nCENTRAL SYSTEM\n(Level 0)", ha='center', va='center', fontsize=10, fontweight='bold')

# Entities
box(ax, 0.5, 4.5, 1.8, 0.8, "STUDENT", fc=C_LGRY)
box(ax, 0.5, 0.7, 1.8, 0.8, "RECRUITER", fc=C_LGRY)
box(ax, 5.7, 4.5, 1.8, 0.8, "GEMINI AI\nAPI", fc=C_LORNG)
box(ax, 5.7, 0.7, 1.8, 0.8, "WEBCAM /\nCAMERA", fc=C_LEMER)

# Flows
def flow(ax, s, e, lbl, rad=0):
    ap = dict(arrowstyle="-|>", color=C_IND, connectionstyle=f"arc3,rad={rad}", lw=1.2)
    ax.annotate("", xy=e, xytext=s, arrowprops=ap)
    ax.text((s[0]+e[0])/2, (s[1]+e[1])/2 + 0.1, lbl, fontsize=7, color=C_IND, ha='center')

flow(ax, (2.3, 4.9), (3.0, 3.8), "Login / Watch / Ask")
flow(ax, (3.2, 2.5), (2.0, 1.5), "Engagement Reports")
flow(ax, (2.3, 1.1), (3.0, 2.2), "Post Internship")
flow(ax, (5.0, 3.8), (5.7, 4.7), "RAG Query")
flow(ax, (6.3, 4.5), (5.2, 3.2), "AI Summary")
flow(ax, (6.6, 1.5), (5.2, 2.6), "Video Stream")

save("internixa_dfd0.png"); plt.close()

print("Final Images Generated in 'image_folder'")
