import os
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = os.path.dirname(__file__)
DIAG = os.path.join(BASE, "diagrams")
OUT  = os.path.join(BASE, "INTERNIXA_FINAL_REPORT.docx")

doc = Document(OUT)

def para(text="", bold=False, italic=False, size=12, align="left", color=None, space_before=0, space_after=6):
    p = doc.add_paragraph()
    p.alignment = {"left":WD_ALIGN_PARAGRAPH.LEFT,"center":WD_ALIGN_PARAGRAPH.CENTER,
                   "justify":WD_ALIGN_PARAGRAPH.JUSTIFY,"right":WD_ALIGN_PARAGRAPH.RIGHT}[align]
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after  = Pt(space_after)
    p.paragraph_format.line_spacing = Pt(18)
    if text:
        run = p.add_run(text)
        run.bold = bold; run.italic = italic
        run.font.name = "Times New Roman"; run.font.size = Pt(size)
        if color: run.font.color.rgb = RGBColor(*color)
    return p

def chapter_heading(num, title):
    doc.add_page_break()
    para(f"CHAPTER {num}", bold=True, size=14, align="center", space_before=24, space_after=4)
    para(title.upper(), bold=True, size=14, align="center", space_before=0, space_after=18)

def section(num, title):
    para(f"{num}  {title}", bold=True, size=12, align="left", space_before=12, space_after=6)

def subsection(num, title):
    para(f"{num}  {title}", bold=True, italic=True, size=12, align="left", space_before=8, space_after=4)

def body(text):
    para(text, size=12, align="justify", space_before=0, space_after=6)

def fig(fname, caption):
    path = os.path.join(DIAG, fname)
    if os.path.exists(path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(path, width=Inches(5.5))
    para(caption, italic=True, size=11, align="center", space_before=2, space_after=12)

def add_table(headers, rows, caption):
    if caption:
        para(caption, bold=True, italic=True, size=11, align="center", space_before=8, space_after=4)
    t = doc.add_table(rows=1+len(rows), cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i,h in enumerate(headers):
        hdr[i].text = h
        for run in hdr[i].paragraphs[0].runs:
            run.bold = True; run.font.size = Pt(9)
        tcp = hdr[i]._tc.get_or_add_tcPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:fill'),'BFD7FF'); shd.set(qn('w:val'),'clear')
        tcp.append(shd)
    for ri,row in enumerate(rows):
        for ci,cell in enumerate(row):
            c = t.rows[ri+1].cells[ci]; c.text = str(cell)
            for run in c.paragraphs[0].runs: run.font.size = Pt(9)
    doc.add_paragraph()

# ═══════════════════════════════════════════════════════════════════════════
# CHAPTER 1 — INTRODUCTION
# ═══════════════════════════════════════════════════════════════════════════
chapter_heading(1, "Introduction")

fig("fig1_1_overview.png", "Fig 1.1 – Internixa System Overview")

section("1.1", "Background")
body("The global landscape of education has undergone a seismic transformation over the past decade, driven by the exponential growth of broadband internet access and the proliferation of smart devices. Massive Open Online Course (MOOC) platforms such as Coursera, Udemy, edX, and India's NPTEL have democratised education, granting learners from every socioeconomic stratum access to world-class curricula. This democratisation accelerated dramatically in the aftermath of the COVID-19 pandemic, which forced institutions worldwide to pivot entirely to remote, digital-first delivery models. According to UNESCO estimates, over 1.5 billion students were affected by school closures during the pandemic, catalysing unprecedented adoption of e-learning tools.")
body("Despite these remarkable advances in accessibility, a fundamental pedagogical weakness persists within the dominant e-learning paradigm. Traditional online platforms are architecturally passive: they deliver content to the learner but possess no mechanism to verify that the learner is actively consuming it. This structural deficiency has given rise to what educators and platform engineers commonly call the \"Background Video\" problem — the phenomenon wherein a student initiates a course video, then diverts their attention to unrelated activities (social media browsing, gaming, or simply leaving the room) while the video continues to play unattended. The platform's engagement metrics record a completed view, yet no actual learning has occurred. This represents a profound failure of the verification model underpinning modern digital education.")
body("The absence of the natural \"academic friction\" that exists in a physical classroom environment is at the heart of this challenge. In a traditional classroom, a teacher's physical presence, eye contact, direct questioning, and real-time feedback create a dynamic environment that inherently demands attention. Online platforms, by contrast, lack these enforcement mechanisms entirely. The result is a well-documented engagement deficit: research by Kizilcec et al. (2017) found that the majority of MOOC participants exhibit passive engagement patterns, and a study by Jordan (2015) documented average completion rates of less than fifteen percent across major platforms. Internixa was conceived specifically to bridge this engagement gap through the intelligent application of browser-based computer vision.")
body("The domain of edge-deployed Artificial Intelligence — where machine learning models execute directly within the client browser rather than on a remote server — has matured significantly with the release of frameworks such as Google's MediaPipe and TensorFlow.js. These tools make it feasible to run complex inference tasks, including real-time facial landmark detection, on consumer-grade hardware with minimal latency. By combining this edge AI capability with a thoughtfully designed full-stack web application, Internixa creates a closed-loop learning ecosystem where every second of content delivery is tied to a verified moment of student attention.")

section("1.2", "Problem Statement")
body("The central problem Internixa addresses is the absence of real-time, verifiable engagement enforcement in contemporary e-learning platforms. Existing systems issue certificates and track progress based on watch-time metrics alone, creating a system that is trivially gameable and fundamentally unable to distinguish between a student who has genuinely mastered a subject and one who has merely allowed a video to play to completion in the background. This represents not only an academic integrity failure but also a disservice to learners themselves, who may receive credentials without having acquired the corresponding competencies.")
body("A secondary and equally significant problem is the quality of AI assistance available within learning platforms. Generic AI chatbots — while capable of answering broad questions — are prone to hallucination and frequently provide answers that are irrelevant to, or inconsistent with, the specific course being studied. A student asking \"What is a primary key?\" during a database course should receive an explanation grounded in the exact pedagogical framing used by their instructor, not a generic internet-sourced definition. The absence of context-locked, course-grounded AI assistance undermines both the accuracy and the academic integrity of AI-supported learning.")
body("Furthermore, the motivational architecture of most e-learning platforms is insufficiently engaging. Platforms that rely solely on linear content delivery without gamification, social comparison, or dynamic reward mechanisms suffer from low retention rates and poor long-term engagement. The integration of competitive elements — such as leaderboards grounded in verified engagement metrics rather than mere watch-time — provides a psychologically robust incentive structure that aligns student motivation with genuine learning behaviours. Internixa addresses all three of these interconnected problems within a single, cohesive platform architecture.")

section("1.3", "Objectives")
body("The primary objectives of the Internixa project are as follows:")
for obj in [
    "1. Real-Time Attention Monitoring: Implement a browser-native AI monitoring system using MediaPipe Face Mesh that processes the student's live camera feed at 30 FPS with a total inference latency of less than 100 milliseconds, enabling near-instantaneous detection of attention state.",
    "2. Intelligent Video Pause/Resume: Develop a state-machine logic layer that automatically pauses the course video upon confirmed distraction (EAR < 0.20 for ≥3 frames or gaze deviation > 35% of inter-eye width) and resumes it seamlessly when active attention is restored.",
    "3. Context-Locked AI Chatbot: Build a Retrieval-Augmented Generation (RAG) pipeline using Pinecone vector embeddings and Google Gemini 1.5 Flash that restricts all AI responses strictly to course transcript content, eliminating out-of-scope hallucinations.",
    "4. Engagement-Gated Certification: Implement a certificate generation system using ReportLab that issues PDF certificates exclusively when a student achieves a verified engagement score of 70% or higher, computed from the ratio of active focus time to total session time.",
    "5. Gamification via Focus Points: Design and implement a Focus Points (FP) scoring algorithm that rewards genuine engagement, course interactions, puzzle completions, and meeting participation, feeding a real-time competitive leaderboard.",
    "6. Live Collaborative Meetings: Build a WebRTC-based multi-participant video meeting system with Socket.IO signaling, providing hosts with a real-time engagement analytics HUD showing per-participant attention metrics.",
    "7. Smart Study Sheets: Integrate Gemini-powered transcript summarization to automatically generate concise, high-priority study sheets from course content upon session completion.",
    "8. Recruiter Portal: Develop a dedicated portal for recruiters to post and manage internship opportunities, with student applicant tracking integrated into the platform's user management system."
]:
    body(obj)

# ═══════════════════════════════════════════════════════════════════════════
# CHAPTER 2 — LITERATURE REVIEW
# ═══════════════════════════════════════════════════════════════════════════
chapter_heading(2, "Literature Review")

section("2.1", "Introduction to Literature Review")
body("The design and implementation of Internixa draws upon a broad and interdisciplinary body of existing research, spanning computer vision, cognitive psychology, natural language processing, real-time web communications, and educational technology. This chapter presents a structured review of the foundational works and existing systems that directly informed the technical and pedagogical decisions made throughout the development of this platform. By situating Internixa within the context of prior art, this review both acknowledges the intellectual lineage of the project's core technologies and identifies the specific gaps and limitations in existing approaches that Internixa is designed to address.")
body("The review is organised thematically across six domains: facial landmark detection and eye-based attention monitoring, engagement and dropout patterns in MOOC platforms, retrieval-augmented generation for grounded AI responses, real-time browser-based communication protocols, gamification theory and its application to e-learning, and existing AI-integrated educational platform solutions. Each domain is examined critically, with an emphasis on both the contributions and the limitations of existing work relative to the requirements of a real-time, browser-native, AI-enforced learning environment.")

section("2.2", "Review of Existing Work")

subsection("2.2.1", "MediaPipe Face Mesh — Google (2020)")
body("Google's MediaPipe Face Mesh (Kartynnik et al., 2019) is a high-fidelity, real-time facial landmark detection pipeline that estimates 468 three-dimensional facial landmarks from a single RGB camera frame. The architecture employs a lightweight convolutional neural network that has been specifically optimised for deployment on mobile and embedded devices, achieving inference speeds of approximately 30 FPS on standard consumer hardware. The landmark coordinates are normalised to the face bounding box, providing robustness against variation in camera distance and face size. Internixa's attention monitoring module relies entirely on MediaPipe Face Mesh as its foundational perception layer, utilising specific landmark indices to compute the Eye Aspect Ratio and gaze deviation metrics that form the basis of the platform's engagement enforcement logic.")
body("The key innovation of MediaPipe Face Mesh relevant to Internixa is its browser-native deployment via the MediaPipe JavaScript library. Unlike previous facial analysis systems that required server-side inference, MediaPipe operates entirely within the client browser using WebAssembly and WebGL acceleration. This edge deployment model ensures that sensitive student video data never leaves the student's device — only derived attention metadata (a boolean attention state and an engagement score) is transmitted to the backend. This privacy-preserving architecture was a critical design requirement for Internixa.")

subsection("2.2.2", "Eye Aspect Ratio — Soukupova & Cech (2016)")
body("The Eye Aspect Ratio (EAR) metric, introduced by Soukupova and Cech in their 2016 paper \"Real-Time Eye Blink Detection using Facial Landmarks,\" provides a computationally efficient scalar measure of eye openness derived from six facial landmark coordinates. The formula computes the ratio of the sum of two vertical eyelid distances to twice the horizontal eye width, yielding a value close to 0.3 for a fully open eye and approaching zero upon eye closure. The authors demonstrated that a threshold-based approach — flagging blink events when EAR drops below 0.20 for three or more consecutive frames — achieves high precision in real-world conditions with minimal false positives.")
body("Internixa directly implements the EAR formula using MediaPipe's landmark indices, adapting the original work's six-point model to MediaPipe's 468-point mesh. The threshold values (EAR < 0.20, duration ≥ 3 frames) were retained from the original paper and validated experimentally during the platform's testing phase. The EAR metric serves as the primary blink and eye-closure detector within Internixa's attention state machine.")

subsection("2.2.3", "MOOC Engagement & Dropout Research")
body("A substantial body of educational research has documented the persistent challenge of student engagement and completion in online courses. Jordan (2015) conducted a comprehensive meta-analysis of completion rates across 221 MOOC offerings, finding a median completion rate of just 12.6%, with rates as low as 3% for some platforms. Kizilcec, Piech, and Schneider (2013) identified four distinct engagement archetypes among MOOC learners — completing, auditing, disengaging, and sampling — with the majority of enrolled students falling into the latter two categories, suggesting that passive enrolment without active engagement is the norm rather than the exception. These findings provide strong empirical justification for Internixa's core premise: that passive content delivery without engagement enforcement produces measurably poor educational outcomes.")
body("Research by Deci and Ryan (2000) on Self-Determination Theory further informs Internixa's gamification design. Their framework identifies autonomy, competence, and relatedness as the three fundamental psychological needs that drive intrinsic motivation. Internixa's Focus Points system and leaderboard address the competence and relatedness dimensions by providing students with concrete, verifiable measures of their engagement performance and situating individual performance within a social comparison context.")

subsection("2.2.4", "Retrieval-Augmented Generation — Lewis et al. (2020)")
body("Lewis et al. (2020) introduced the Retrieval-Augmented Generation (RAG) paradigm in their NeurIPS paper, demonstrating that the factual accuracy and groundedness of large language model responses could be dramatically improved by conditioning generation on documents retrieved from an external knowledge store. The RAG framework combines a dense passage retrieval component (using approximate nearest-neighbour search over pre-computed embeddings) with a sequence-to-sequence generation model, enabling the system to produce responses that are both fluent and faithful to a specific corpus of source documents.")
body("Internixa implements a production RAG pipeline adapted from this framework. Course video transcripts are chunked into 500-character segments with 50-character overlaps, embedded using Google's text-embedding-004 model to produce 768-dimensional vectors, and indexed in a Pinecone serverless vector database. At query time, the student's question is embedded using the same model, and cosine similarity search retrieves the top-three most relevant transcript chunks. These chunks are injected into a structured prompt template that explicitly instructs the Gemini 1.5 Flash model to answer based only on the provided context, effectively eliminating out-of-scope hallucinations.")

subsection("2.2.5", "WebRTC — W3C Standard (2021)")
body("Web Real-Time Communication (WebRTC) is a W3C and IETF standard that enables browser-to-browser audio, video, and data streaming without requiring plugins or native applications. The WebRTC architecture employs Interactive Connectivity Establishment (ICE) with STUN (Session Traversal Utilities for NAT) servers to negotiate peer-to-peer connections across Network Address Translation (NAT) boundaries. Session Description Protocol (SDP) is used to negotiate codec parameters and media formats during the offer/answer handshake. Internixa's meeting module builds a full-mesh peer topology using WebRTC RTCPeerConnection objects, with Socket.IO serving as the signaling channel for SDP and ICE candidate exchange.")

subsection("2.2.6", "Gamification in E-Learning — Deterding et al. (2011)")
body("Deterding, Dixon, Khaled, and Nacke (2011) provided the foundational academic definition of gamification as \"the use of game design elements in non-game contexts,\" distinguishing it from game-like simulations and toy interfaces. Their Points-Badges-Leaderboards (PBL) framework has since been extensively studied in educational contexts. Hamari, Koivisto, and Sarsa (2014) conducted a systematic literature review of gamification studies, finding that the majority reported positive effects on engagement and motivation, particularly in learning environments. Internixa's Focus Points system implements a PBL-inspired design, awarding points for verified engagement behaviours and displaying competitive rankings on a real-time leaderboard.")

section("2.3", "Comparative Analysis")
add_table(
    ["Feature","Coursera","Udemy","Google Classroom","INTERNIXA"],
    [
        ["AI Attention Monitoring","✗","✗","✗","✓ (MediaPipe)"],
        ["Auto Video Pause on Distraction","✗","✗","✗","✓"],
        ["Context-Locked AI Chatbot","✗","✗","✗","✓ (RAG + Gemini)"],
        ["Engagement-Based Certificate","✗","✗","✗","✓ (≥70% Focus)"],
        ["Gamification (Points/Leaderboard)","Partial","✗","✗","✓ (Focus Points)"],
        ["Live Video Meetings","✗","✗","✓","✓ (WebRTC)"],
        ["Real-Time Engagement Analytics","✗","✗","✗","✓ (Host HUD)"],
        ["Smart AI Study Sheets","✗","✗","✗","✓ (Gemini)"],
        ["Recruiter Portal","✗","Partial","✗","✓"],
        ["Privacy-Preserving Edge AI","N/A","N/A","N/A","✓ (On-device)"],
    ],
    "Table 2.1 – Comparative Analysis of E-Learning Platforms"
)

doc.save(OUT)
print("Chapters 1 & 2 done. Saved.")
