import os, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

OUT = os.path.join(os.path.dirname(__file__), "diagrams")
os.makedirs(OUT, exist_ok=True)
C_IND="#1E40AF"; C_LBLU="#F0F9FF"; C_TXT="#000000"; C_BG="#FFFFFF"; C_LGRY="#F8FAFC"; C_GRN="#059669"

def save(n): plt.savefig(os.path.join(OUT,n),dpi=150,bbox_inches='tight',facecolor=C_BG)

def box(ax,x,y,w,h,txt,fc=C_LBLU,ec=C_IND,fs=9,bold=True):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle="round,pad=0.04",facecolor=fc,edgecolor=ec,linewidth=1.5))
    ax.text(x+w/2,y+h/2,txt,ha='center',va='center',fontsize=fs,color=C_TXT,
            fontweight='bold' if bold else 'normal',wrap=True)

def arrow(ax,x1,y1,x2,y2,lbl=""):
    ax.annotate("",xy=(x2,y2),xytext=(x1,y1),arrowprops=dict(arrowstyle="-|>",color=C_IND,lw=1.5))
    if lbl:
        ax.text((x1+x2)/2,(y1+y2)/2+0.12,lbl,fontsize=7,color=C_IND,ha='center')

# ── Fig 3.5  Face Mesh ───────────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(7,7)); ax.set_xlim(-1.2,1.2); ax.set_ylim(-1.5,1.2); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 3.5 – MediaPipe Face Mesh (468 Landmarks)",fontsize=11,fontweight='bold',color=C_TXT)
# Face oval
theta=np.linspace(0,2*math.pi,200)
fx=0.55*np.cos(theta); fy=0.75*np.sin(theta)-0.1
ax.plot(fx,fy,color=C_IND,lw=1.5,alpha=0.4)
# Scatter random landmark dots
np.random.seed(42)
pts_x=0.52*np.random.uniform(-1,1,468)*np.cos(np.random.uniform(0,2*math.pi,468))
pts_y=0.72*np.random.uniform(-1,1,468)*np.sin(np.random.uniform(0,2*math.pi,468))-0.1
mask=(pts_x**2/0.55**2+(pts_y+0.1)**2/0.75**2)<1
ax.scatter(pts_x[mask],pts_y[mask],s=4,color=C_IND,alpha=0.6)
# Key labelled landmarks
key_pts={"p33\n(L.Eye Inner)":(0.18,0.05),"p133\n(L.Eye Outer)":(0.38,0.04),
         "p263\n(R.Eye Inner)":(-0.18,0.05),"p4\n(Nose Tip)":(0.0,-0.18),
         "p145\n(Lower Lid)":(0.28,-0.04),"p159\n(Upper Lid)":(0.28,0.14)}
for lbl,(kx,ky) in key_pts.items():
    ax.plot(kx,ky,'o',color=C_GRN,ms=8,zorder=5)
    ax.text(kx+0.06,ky+0.04,lbl,fontsize=7,color=C_TXT)
ax.text(0,-1.35,"MediaPipe provides 468 3D landmarks normalised to [0,1] coordinate space",
        ha='center',fontsize=8,color=C_TXT,style='italic')
save("fig3_5_facemesh.png"); plt.close()

# ── Fig 3.6  EAR Diagram ─────────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(8,5)); ax.set_xlim(0,8); ax.set_ylim(0,5); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 3.6 – Eye Aspect Ratio (EAR) Landmark Diagram",fontsize=11,fontweight='bold',color=C_TXT)
# Eye shape
ex=[1.5,2.5,3.5,4.5,5.5,4.5,3.5,2.5,1.5]; ey=[2.5,3.2,3.4,3.2,2.5,1.8,1.6,1.8,2.5]
ax.plot(ex,ey,color=C_IND,lw=2); ax.fill(ex,ey,alpha=0.08,color=C_LBLU)
pts={"p33":(1.5,2.5),"p133":(5.5,2.5),"p159":(3.5,3.4),"p145":(3.5,1.6),
     "p158":(2.5,3.2),"p144":(2.5,1.8)}
colors={"p33":C_IND,"p133":C_IND,"p159":C_GRN,"p145":C_GRN,"p158":"#F59E0B","p144":"#F59E0B"}
for lbl,(px,py) in pts.items():
    ax.plot(px,py,'o',color=colors[lbl],ms=10,zorder=5)
    ax.text(px,py+0.25,lbl,ha='center',fontsize=9,fontweight='bold',color=C_TXT)
# Vertical lines
for a,b in[("p159","p145"),("p158","p144")]:
    ax.plot([pts[a][0],pts[b][0]],[pts[a][1],pts[b][1]],'--',color=C_GRN,lw=1.5)
ax.plot([pts["p33"][0],pts["p133"][0]],[pts["p33"][1],pts["p133"][1]],'--',color=C_IND,lw=1.5)
formula="EAR  =  (‖p₁₅₉ − p₁₄₅‖  +  ‖p₁₅₈ − p₁₄₄‖)  /  (2 × ‖p₃₃ − p₁₃₃‖)"
ax.text(3.5,0.5,formula,ha='center',fontsize=10,color=C_IND,
        bbox=dict(boxstyle='round',facecolor='#EEF2FF',edgecolor=C_IND))
ax.text(3.5,0.1,"Threshold: EAR < 0.20 for ≥3 consecutive frames → Blink / Eyes Closed",
        ha='center',fontsize=8,color=C_TXT,style='italic')
save("fig3_6_ear.png"); plt.close()

# ── Fig 3.7  Gaze Detection Flow ─────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(9,4)); ax.set_xlim(0,9); ax.set_ylim(0,4); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 3.7 – Gaze Detection Algorithm Flow",fontsize=11,fontweight='bold',color=C_TXT)
steps=[("Camera\nFrame",0.2,1.5,1.3,1.0,C_LGRY),
       ("MediaPipe\n468 Landmarks",1.9,1.5,1.7,1.0,C_LBLU),
       ("Compute\nEye Midpoint Mx",4.0,1.5,1.7,1.0,C_LBLU),
       ("Compute\nNose Deviation",6.1,1.5,1.5,1.0,C_LBLU)]
for t,x,y,w,h,fc in steps: box(ax,x,y,w,h,t,fc=fc,fs=8)
arrow(ax,1.5,2.0,1.9,2.0); arrow(ax,3.6,2.0,4.0,2.0); arrow(ax,5.7,2.0,6.1,2.0)
ax.text(7.6,2.0,"Dev > 0.35×W?",ha='center',va='center',fontsize=9,fontweight='bold',color=C_TXT)
ax.add_patch(FancyBboxPatch((7.0,1.5),1.2,1.0,boxstyle="round,pad=0.04",fc="#FEF9C3",ec="#F59E0B",lw=1.5))
arrow(ax,7.6,1.5,7.6,0.9)
ax.text(5.5,0.6,"YES → Pause Video",fontsize=9,color="#EF4444",fontweight='bold')
ax.text(7.6,0.6,"NO → Play Video",fontsize=9,color=C_GRN,fontweight='bold')
formula2="Mx = (p₃₃.x + p₂₆₃.x)/2    |    Deviation = |p₄.x − Mx|"
ax.text(4.5,0.15,formula2,ha='center',fontsize=8,color=C_IND,style='italic')
save("fig3_7_gaze.png"); plt.close()

# ── Fig 3.8  RAG Pipeline ────────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(12,4)); ax.set_xlim(0,12); ax.set_ylim(0,4); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 3.8 – RAG (Retrieval-Augmented Generation) Pipeline",fontsize=11,fontweight='bold',color=C_TXT)
steps=[("Student\nQuery",0.2,1.5,1.4,1.0,C_LGRY),
       ("Embed Query\ntext-embedding-004",2.0,1.5,1.8,1.0,C_LBLU),
       ("Pinecone\nVector Search\n(Top-K=3)",4.2,1.5,1.8,1.0,"#D1FAE5"),
       ("Retrieve\nTranscript\nChunks",6.4,1.5,1.7,1.0,"#FEF9C3"),
       ("Inject into\nGemini\nPrompt",8.5,1.5,1.5,1.0,C_LBLU),
       ("Context-Locked\nAI Response",10.3,1.5,1.5,1.0,C_GRN)]
for t,x,y,w,h,fc in steps: box(ax,x,y,w,h,t,fc=fc,fs=8)
for xs,xe in[(1.6,2.0),(3.8,4.2),(6.1,6.4),(8.1,8.5),(10.0,10.3)]:
    arrow(ax,xs,2.0,xe,2.0)
ax.text(6.0,0.4,"Cosine Similarity: sim(q,d) = (q·d)/(‖q‖‖d‖)",
        ha='center',fontsize=8,color=C_IND,style='italic')
save("fig3_8_rag.png"); plt.close()

# ── Fig 3.9  WebRTC Signaling ────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(10,6)); ax.set_xlim(0,10); ax.set_ylim(0,6); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 3.9 – WebRTC Signaling Diagram (Socket.IO)",fontsize=11,fontweight='bold',color=C_TXT)
ax.axvline(1.5,ymin=0.1,ymax=0.88,color=C_IND,lw=2,linestyle='--',alpha=0.5)
ax.axvline(5.0,ymin=0.1,ymax=0.88,color=C_GRN,lw=2,linestyle='--',alpha=0.5)
ax.axvline(8.5,ymin=0.1,ymax=0.88,color=C_IND,lw=2,linestyle='--',alpha=0.5)
for x,lbl,c in[(1.5,"Peer A\n(Host)",C_IND),(5.0,"Socket.IO\nServer",C_GRN),(8.5,"Peer B\n(Joiner)",C_IND)]:
    box(ax,x-0.7,5.0,1.4,0.7,lbl,fc=C_LBLU if c==C_IND else "#D1FAE5",ec=c,fs=9)
msgs=[(4.5,"join-room →",1.5,4.4,5.0,4.4),
      (4.5,"← offer (SDP)",5.0,3.8,8.5,3.8),
      (4.5,"answer (SDP) →",1.5,3.2,5.0,3.2),
      (4.5,"← ICE candidates",5.0,2.6,8.5,2.6),
      (7.5,"P2P Video Stream ⟶",1.5,1.8,8.5,1.8)]
for _,lbl,x1,y1,x2,y2 in msgs:
    arrow(ax,x1,y1,x2,y2)
    ax.text((x1+x2)/2,y1+0.12,lbl,ha='center',fontsize=8,color=C_TXT)
ax.text(5.0,0.4,"STUN Server resolves NAT  |  P2P channel established after ICE negotiation",
        ha='center',fontsize=8,color=C_IND,style='italic')
save("fig3_9_webrtc.png"); plt.close()

# ── Fig 3.10  Certificate Flow ───────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(10,4)); ax.set_xlim(0,10); ax.set_ylim(0,4); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 3.10 – Certificate Generation Flow",fontsize=11,fontweight='bold',color=C_TXT)
steps=[("Session\nComplete",0.2,1.5,1.5,1.0,C_LGRY),
       ("Calculate\nEngagement\nScore",2.1,1.5,1.6,1.0,C_LBLU),
       ("Score\n≥ 70%?",4.1,1.5,1.4,1.0,"#FEF9C3"),
       ("ReportLab\nGenerates PDF",6.0,1.5,1.7,1.0,C_LBLU),
       ("Cert Stored\n& Emailed",8.1,1.5,1.7,1.0,C_GRN)]
for t,x,y,w,h,fc in steps: box(ax,x,y,w,h,t,fc=fc,fs=8)
arrow(ax,1.7,2.0,2.1,2.0); arrow(ax,3.7,2.0,4.1,2.0); arrow(ax,5.5,2.0,6.0,2.0)
arrow(ax,7.7,2.0,8.1,2.0)
ax.annotate("",xy=(4.8,0.8),xytext=(4.8,1.5),arrowprops=dict(arrowstyle="-|>",color="#EF4444",lw=1.5))
ax.text(4.8,0.5,"NO → Prompt Retry\n(Score < 70%)",ha='center',fontsize=8,color="#EF4444")
save("fig3_10_cert.png"); plt.close()

# ── Fig 4.2  Engagement Score ────────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(9,4)); ax.set_xlim(0,9); ax.set_ylim(0,4); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 4.2 – Engagement Score Calculation Flow",fontsize=11,fontweight='bold',color=C_TXT)
steps=[("Active Focus\nTime (sec)",0.2,1.5,1.6,1.0,C_LGRY),
       ("Total Session\nTime (sec)",0.2,0.2,1.6,1.0,C_LGRY),
       ("Score Formula\nFP = (Active/Total)×100×W",2.2,1.0,2.2,1.2,C_LBLU),
       ("Apply Bonuses\n+FP for Chat,\nPuzzle, Meeting",4.8,1.0,1.8,1.2,C_LBLU),
       ("Final Focus\nPoints (FP)",7.0,1.0,1.8,1.2,C_GRN)]
for t,x,y,w,h,fc in steps: box(ax,x,y,w,h,t,fc=fc,fs=8)
arrow(ax,1.8,2.0,2.2,1.6); arrow(ax,1.8,0.7,2.2,1.2)
arrow(ax,4.4,1.6,4.8,1.6); arrow(ax,6.6,1.6,7.0,1.6)
ax.text(4.5,3.3,"W = Course Weight Factor (1.0–2.0 based on difficulty)",
        ha='center',fontsize=8,color=C_IND,style='italic')
save("fig4_2_score.png"); plt.close()

# ── Fig 4.3  Focus Points Algorithm ─────────────────────────────────────────
fig,ax=plt.subplots(figsize=(7,8)); ax.set_xlim(0,7); ax.set_ylim(0,8); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 4.3 – Focus Points (FP) Algorithm Flowchart",fontsize=11,fontweight='bold',color=C_TXT)
nodes=[("START",2.5,7.0,2.0,0.6,C_GRN),
       ("Video Starts\nTimer Begins",2.5,5.8,2.0,0.8,C_LBLU),
       ("AI Monitoring\nActive?",2.5,4.6,2.0,0.8,"#FEF9C3"),
       ("Increment\nActive Time",0.5,3.4,2.0,0.8,C_LBLU),
       ("Increment\nDistracted Time",4.5,3.4,2.0,0.8,"#FEE2E2"),
       ("Session\nEnd?",2.5,2.2,2.0,0.8,"#FEF9C3"),
       ("Calculate FP\n= (Active/Total)×100×W",2.5,1.0,2.0,0.8,C_LBLU),
       ("Update MongoDB\n+ Leaderboard",2.5,0.0,2.0,0.8,C_GRN)]
for t,x,y,w,h,fc in nodes: box(ax,x,y,w,h,t,fc=fc,fs=8)

# Vertical arrows
arrow(ax,3.5,7.0,3.5,6.6)
arrow(ax,3.5,5.8,3.5,5.4)

# Decision arrows (YES/NO) - Fixed starting from sides of "AI Monitoring Active?"
# Box is at (2.5, 4.6, 2.0, 0.8) -> Left: 2.5, Right: 4.5, Vertical Mid: 5.0
# YES (Left)
arrow(ax,2.5,5.0,1.5,4.2)
ax.text(1.9,4.9,"YES",fontsize=9,color=C_GRN,fontweight='bold',ha='right')

# NO (Right)
arrow(ax,4.5,5.0,5.5,4.2)
ax.text(5.1,4.9,"NO",fontsize=9,color="#EF4444",fontweight='bold',ha='left')

# Return arrows to Session End?
arrow(ax,1.5,3.4,3.0,2.6)
arrow(ax,5.5,3.4,4.0,2.6)

# Final flow
arrow(ax,3.5,2.2,3.5,1.8)
arrow(ax,3.5,1.0,3.5,0.8)

save("fig4_3_fp.png"); plt.close()

# ── Fig 4.1  System Requirements ─────────────────────────────────────────────
fig,ax=plt.subplots(figsize=(9,5)); ax.set_xlim(0,9); ax.set_ylim(0,5); ax.axis('off')
ax.set_facecolor(C_BG)
ax.set_title("Fig 4.1 – System Requirements Overview",fontsize=11,fontweight='bold',color=C_TXT)
headers=["Component","Minimum Requirement","Recommended"]
rows=[["Browser","Chrome 90+ / Firefox 88+","Chrome 110+"],
      ["Webcam","720p USB / Built-in","1080p HD"],
      ["CPU","Intel i3 / Ryzen 3","Intel i5+ / Ryzen 5+"],
      ["RAM","4 GB","8 GB+"],
      ["Internet","5 Mbps (Learning)","20 Mbps (WebRTC)"],
      ["OS","Windows 10 / macOS 11","Windows 11 / macOS 13"],
      ["Node.js","18.x (Frontend Dev)","20.x LTS"],
      ["Python","3.10+","3.11+"]]
col_w=[2.5,3.0,2.5]; col_x=[0.2,2.7,5.7]; row_h=0.48
for ci,h in enumerate(headers):
    ax.add_patch(FancyBboxPatch((col_x[ci],4.3),col_w[ci],0.5,boxstyle="round,pad=0.02",
                                facecolor="#BFD7FF",edgecolor=C_IND,lw=1))
    ax.text(col_x[ci]+col_w[ci]/2,4.55,h,ha='center',va='center',fontsize=9,fontweight='bold',color=C_TXT)
for ri,row in enumerate(rows):
    fc="#F8FAFC" if ri%2==0 else C_BG
    for ci,cell in enumerate(row):
        ax.add_patch(FancyBboxPatch((col_x[ci],4.3-(ri+1)*row_h),col_w[ci],row_h,
                                    boxstyle="round,pad=0.01",facecolor=fc,edgecolor="#CBD5E1",lw=0.5))
        ax.text(col_x[ci]+col_w[ci]/2,4.3-(ri+1)*row_h+row_h/2,cell,
                ha='center',va='center',fontsize=8,color=C_TXT)
save("fig4_1_requirements.png"); plt.close()

print("Part 2 diagrams done. All 14 diagrams generated.")
