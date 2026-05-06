import os, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

OUT = os.path.join(os.path.dirname(__file__), "diagrams")
os.makedirs(OUT, exist_ok=True)

C_IND  = "#1E40AF"
C_LBLU = "#F0F9FF"
C_GRN  = "#059669"
C_RED  = "#DC2626"
C_BG   = "#FFFFFF"
C_TXT  = "#000000"
C_LGRY = "#F8FAFC"

def save(name): plt.savefig(os.path.join(OUT, name), dpi=150, bbox_inches='tight', facecolor=C_BG)

def box(ax, x, y, w, h, txt, fc=C_LBLU, ec=C_IND, fs=9):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle="round,pad=0.04",
                                facecolor=fc,edgecolor=ec,linewidth=1.5))
    ax.text(x+w/2,y+h/2,txt,ha='center',va='center',fontsize=fs,
            color=C_TXT,fontweight='bold',wrap=True)

def arrow(ax,x1,y1,x2,y2):
    ax.annotate("",xy=(x2,y2),xytext=(x1,y1),
                arrowprops=dict(arrowstyle="-|>",color=C_IND,lw=1.5))

# ── Fig 1.1  System Overview ─────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(10,5)); ax.set_xlim(0,10); ax.set_ylim(0,5); ax.axis('off')
ax.set_facecolor(C_BG); ax.set_title("Fig 1.1 – Internixa System Overview",fontsize=12,fontweight='bold',color=C_TXT)
layers=[("Student / Recruiter\n(Browser)",0.5,3.8,C_LGRY),
        ("React 19 + MediaPipe\n(Frontend AI)",0.5,2.6,C_LBLU),
        ("FastAPI Backend\n(Python ASGI)",3.5,2.6,C_LBLU),
        ("MongoDB + Pinecone\n(Databases)",6.5,2.6,C_LBLU),
        ("Gemini LLM\n(RAG/Summary)",6.5,1.2,C_LBLU),
        ("WebRTC + Socket.IO\n(Real-time)",3.5,1.2,C_LBLU),
        ("Vercel + Railway\n(Deployment)",0.5,1.2,C_LGRY)]
for txt,x,y,fc in layers: box(ax,x,y,2.6,0.95,txt,fc=fc)
for pair in[((1.8,3.8),(1.8,3.55)),((1.8,2.6),(3.5,3.08)),
            ((4.8,3.08),(6.5,3.08)),((4.8,1.7),(6.5,1.7)),
            ((3.5,2.6),(3.5,2.15)),((1.8,2.6),(1.8,2.15))]:
    arrow(ax,*pair[0],*pair[1])
save("fig1_1_overview.png"); plt.close()

# ── Fig 3.1  Traditional LMS ─────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(9,4)); ax.set_xlim(0,9); ax.set_ylim(0,4); ax.axis('off')
ax.set_facecolor(C_BG); ax.set_title("Fig 3.1 – Traditional LMS Architecture",fontsize=12,fontweight='bold',color=C_TXT)
items=[("Student",0.3,1.5,1.4,1.0,C_LGRY),
       ("LMS Server\n(Moodle/Canvas)",2.5,1.2,2.0,1.4,C_LBLU),
       ("Video CDN",5.5,2.2,1.8,0.9,C_LGRY),
       ("Database",5.5,0.8,1.8,0.9,C_LGRY),
       ("Manual Certificate",7.7,1.5,1.0,0.9,"#FEF9C3")]
for t,x,y,w,h,fc in items: box(ax,x,y,w,h,t,fc=fc)
for a,b in[((1.7,2.0),(2.5,1.9)),((4.5,1.9),(5.5,2.65)),
           ((4.5,1.7),(5.5,1.25)),((7.3,1.9),(7.7,1.95))]:
    arrow(ax,*a,*b)
save("fig3_1_traditional.png"); plt.close()

# ── Fig 3.2  5-Layer Architecture ────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(10,6)); ax.set_xlim(0,10); ax.set_ylim(0,6); ax.axis('off')
ax.set_facecolor(C_BG); ax.set_title("Fig 3.2 – Internixa 5-Layer Architecture",fontsize=12,fontweight='bold',color=C_TXT)
lyrs=[("Layer 5 – User Layer\nStudent Browser  |  Recruiter Browser",0.3,5.1,9.4,0.75,"#E0E7FF"),
      ("Layer 4 – Frontend\nReact 19  |  Vite  |  TailwindCSS  |  MediaPipe Face Mesh",0.3,4.1,9.4,0.75,C_LBLU),
      ("Layer 3 – Real-time\nSocket.IO Signaling  |  WebRTC Peer Mesh",0.3,3.1,9.4,0.75,"#D1FAE5"),
      ("Layer 2 – Backend API\nFastAPI  |  JWT Auth  |  ReportLab  |  Gemini API  |  Pinecone",0.3,2.1,9.4,0.75,C_LBLU),
      ("Layer 1 – Data Layer\nMongoDB (Users, Courses, Sessions)  |  Pinecone (Embeddings)",0.3,1.1,9.4,0.75,"#FEE2E2")]
for t,x,y,w,h,fc in lyrs:
    box(ax,x,y,w,h,t,fc=fc,fs=9)
    if y<5.1: arrow(ax,5.0,y+0.75,5.0,y+0.95)
save("fig3_2_arch.png"); plt.close()

# ── Fig 3.3  DFD Level 0 ─────────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(8,5)); ax.set_xlim(0,8); ax.set_ylim(0,5); ax.axis('off')
ax.set_facecolor(C_BG); ax.set_title("Fig 3.3 – DFD Level 0 (Context Diagram)",fontsize=12,fontweight='bold',color=C_TXT)
ax.add_patch(plt.Circle((4,2.5),1.1,fc=C_LBLU,ec=C_IND,lw=2))
ax.text(4,2.5,"INTERNIXA\nSYSTEM",ha='center',va='center',fontsize=10,fontweight='bold',color=C_TXT)
ents=[("Student",1.0,4.2),("Recruiter",1.0,0.8),("Gemini AI",7.0,3.5),("Camera",7.0,1.5)]
for lbl,x,y in ents:
    ax.add_patch(FancyBboxPatch((x-0.7,y-0.3),1.4,0.6,boxstyle="round,pad=0.05",fc=C_LGRY,ec=C_IND,lw=1.5))
    ax.text(x,y,lbl,ha='center',va='center',fontsize=9,fontweight='bold',color=C_TXT)
flows=[((1.7,4.35),(2.95,2.95),"Login, Watch, Ask"),
       ((1.7,0.95),(2.95,2.1),"Post Internship"),
       ((5.1,2.75),(6.3,3.3),"LLM Query"),
       ((5.1,2.3),(6.3,1.65),"Video Frame")]
for s,e,lbl in flows:
    arrow(ax,*s,*e)
    mx,my=(s[0]+e[0])/2,(s[1]+e[1])/2
    ax.text(mx,my+0.12,lbl,fontsize=7,color=C_IND,ha='center')
save("fig3_3_dfd0.png"); plt.close()

# ── Fig 3.4  DFD Level 1 ─────────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(14,9)); ax.set_xlim(0,14); ax.set_ylim(0,9); ax.axis('off')
ax.set_facecolor(C_BG); ax.set_title("Fig 3.4 – DFD Level 1 (Detailed Data Flow)",fontsize=14,fontweight='bold',color=C_TXT)

# Entities
box(ax,0.5,7.0,2.0,0.8,"STUDENT",fc="#E2E8F0")
box(ax,0.5,1.0,2.0,0.8,"RECRUITER",fc="#E2E8F0")

# Processes (Circles)
def proc(ax, x, y, r, num, txt):
    circ = plt.Circle((x,y), r, fc=C_LBLU, ec=C_IND, lw=2)
    ax.add_patch(circ)
    ax.text(x, y+0.2, num, ha='center', va='center', fontsize=9, fontweight='bold')
    ax.text(x, y-0.2, txt, ha='center', va='center', fontsize=8, wrap=True)

proc(ax, 4.0, 7.5, 0.8, "1.0", "Auth &\nProfile")
proc(ax, 4.0, 4.5, 0.8, "2.0", "Learning\nEngine")
proc(ax, 8.0, 7.5, 0.8, "3.0", "AI\nMonitor")
proc(ax, 8.0, 4.5, 0.8, "4.0", "Meeting\nSystem")
proc(ax, 11.5, 7.5, 0.8, "5.0", "RAG\nIntelligence")
proc(ax, 11.5, 4.5, 0.8, "6.0", "Certificate\nGen")
proc(ax, 8.0, 1.5, 0.8, "7.0", "Talent\nEvaluation")

# Data Stores
def dstore(ax, x, y, w, h, num, txt):
    ax.plot([x, x+w], [y, y], color=C_IND, lw=1.5)
    ax.plot([x, x+w], [y+h, y+h], color=C_IND, lw=1.5)
    ax.text(x+0.3, y+h/2, num, ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(x+w/2+0.2, y+h/2, txt, ha='center', va='center', fontsize=8)

dstore(ax, 4.0, 1.0, 2.5, 0.8, "D1", "MongoDB (User/Course)")
dstore(ax, 11.0, 1.0, 2.5, 0.8, "D2", "Pinecone (Vectors)")

# Data Flows
flows = [
    ((1.5,7.0),(3.2,7.5), "Credentials"),
    ((4.8,7.5),(7.2,7.5), "Auth Token"),
    ((1.5,7.2),(3.3,5.1), "Enrollment"),
    ((4.0,6.7),(4.0,1.8), "User Data"),
    ((4.8,4.5),(7.2,4.5), "Session Start"),
    ((8.8,7.5),(10.7,7.5), "Gaze Data"),
    ((11.5,6.7),(11.5,5.3), "Focus Score"),
    ((8.0,5.3),(8.0,6.7), "Media Stream"),
    ((5.5,1.8),(7.3,1.8), "Profile Access"),
    ((12.0,1.8),(11.5,3.7), "Query Vector"),
    ((1.5,1.8),(7.2,1.5), "Talent Search"),
]

for s, e, lbl in flows:
    arrow(ax, *s, *e)
    mx, my = (s[0]+e[0])/2, (s[1]+e[1])/2
    ax.text(mx, my+0.1, lbl, fontsize=7, color=C_IND, ha='center', rotation=0)

save("fig3_4_dfd1.png"); plt.close()

print("Part 1 diagrams done.")
