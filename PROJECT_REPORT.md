# INTERNIXA: AI-Monitored Learning Platform
## Project Report & Presentation (10-Slide Structure)

---

### Slide 1: Executive Overview
**Project Name:** INTERNIXA  
**Tagline:** Bridging the Gap Between Online Learning and Real-World Accountability.  

**Overview:**  
InternNixa is a next-generation E-learning platform designed to ensure student engagement and academic integrity through real-time AI monitoring. By leveraging advanced computer vision, the platform tracks student attention during video sessions, providing a level of oversight previously only available in physical classrooms.

---

### Slide 2: The Problem Statement
**The Challenge of Remote Education:**  
1.  **Passive Participation:** Students often "play" course videos in the background without active engagement.  
2.  **Lack of Accountability:** Educators have no way to verify if a student actually watched and understood the material.  
3.  **Credential Inflation:** Certificates are often awarded based on completion time rather than proven attention or proficiency.  
4.  **Distractions:** The digital environment is full of distractions (phones, other tabs) that reduce learning efficacy.

---

### Slide 3: The InternNixa Solution
**A Proactive Approach to Integrity:**  
- **Real-Time Monitoring:** Continuous gaze tracking ensures the student is looking at the lesson.  
- **Active Pause:** The system automatically pauses content the moment a student looks away or leaves the frame.  
- **Engagement Scoring:** Metrics are generated based on "Active Time" vs. "Total Session Time," providing a quantitative measure of focus.  
- **Integrity Gates:** Security puzzles triggered by too many distractions ensure that only attentive users proceed.

---

### Slide 4: Technical Stack (Frontend)
**Modern & Performance-Driven:**  
- **Core Framework:** **React 19** with **Vite** for a blazing-fast user experience.  
- **AI Engine:** **MediaPipe (Face Mesh)** for lightweight, browser-based facial landmark detection.  
- **Computer Vision Utilities:** Custom implementation of `@mediapipe/camera_utils` to handle high-frequency webcam frames without UI lag.  
- **Routing:** **React Router 7** for seamless navigation between the Dashboard, Course Details, and Monitoring Sessions.

---

### Slide 5: Technical Stack (Backend)
**Scalable & Robust Infrastructure:**  
- **API Framework:** **FastAPI (Python 3.10+)** for high-performance asynchronous operations.  
- **Database:** **MongoDB** (NoSQL) for flexible storage of course metadata, user progress, and session logs.  
- **Asynchronous Driver:** **Motor** for non-blocking database interactions.  
- **Security:** **JWT (JSON Web Tokens)** for secure authentication and **Passlib (Bcrypt)** for industry-standard password hashing.  
- **Server:** **Uvicorn** for lightning-fast ASGI serving.

---

### Slide 6: Gaze Tracking & Focus Logic
**How the AI "Sees" Focus:**  
The platform calculates focus by analyzing specific facial landmarks in the video stream:
- **Nose Tip vs. Eyes:** The system calculates the horizontal midpoint between the eyes and compares it to the position of the nose tip.  
- **Threshold Detection:** If the nose tip deviates significantly from the midpoint (indicating the head is turned), the user is flagged as "Distracted."  
- **Asymmetric Debounce:** A "Face Found" signal is processed instantly, while a "Face Lost" signal waits 800ms to avoid false positives from brief blinks or lighting changes.

---

### Slide 7: Integrity & Warning Systems
**Maintaining the Learning Flow:**  
- **Warning Counter:** If a user is distracted for more than 3 continuous seconds, a warning is issued.  
- **The "3-Strike" Rule:** After 3 warnings, the session is forcibly paused.  
- **Security Puzzles:** To resume a paused session, the user must solve an interactive puzzle (powered by `PuzzleModal`), verifying that a human is actively present and ready to learn.  
- **Visual Feedback:** A glassmorphism overlay blurs the video during distractions, preventing the user from consuming content while not focused.

---

### Slide 8: Certification & Engagement Engine
**Data-Driven Credentials:**  
- **Engagement Scoring:** `(Active Time / Total Time) * 100`. Only scores above 75% are eligible for certification.  
- **Automated Generation:** Upon course completion, the backend triggers a **ReportLab** script.  
- **PDF Composition:** High-quality certificates are generated with:
    - Unique **Verification IDs** (UUID).
    - Engagement metrics recorded directly on the document.
    - AI-verified digital seals.
- **Dynamic Delivery:** Certificates are served via secure API endpoints for immediate download.

---

### Slide 9: System Architecture & Data Flow
**End-to-End Workflow:**  
1.  **Capture:** User's webcam captures frames at 30 FPS.  
2.  **Analysis:** MediaPipe (Frontend) identifies facial landmarks and calculates orientation.  
3.  **Action:** Frontend logic controls the YouTube API (Play/Pause) based on focus state.  
4.  **Persistence:** Upon session completion, stats (Active Time, Warnings, Course ID) are sent to the FastAPI backend.  
5.  **Validation:** Backend verifies completion criteria and updates the MongoDB `enrollments` and `certificates` collections.

---

### Slide 10: Conclusion & Future Roadmap
**Impact & Evolution:**  
InternNixa sets a new standard for online training integrity.  
- **Current Impact:** Reductions in passive video completion and increased student focus.  
- **Future Roadmap:**  
    - **Multi-Face Detection:** Preventing substitutions during sessions.  
    - **Emotion Analysis:** Detecting student frustration or boredom to adjust content difficulty.  
    - **LMS Integration:** Plugging InternNixa's monitoring engine into platforms like Canvas or Moodle.
