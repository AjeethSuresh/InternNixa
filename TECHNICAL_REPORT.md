# InternNixa: Technical Project Report

## 1. Project Overview
**InternNixa** is a state-of-the-art AI-monitored E-learning and video conferencing platform designed to ensure academic integrity and student engagement. It features an **AI-monitored course player** and a **WebRTC-powered meeting platform**, both of which track user attention in real-time using advanced computer vision.

---

## 2. Frontend Architecture
The frontend is built with a focus on high performance, modern aesthetics, and real-time responsiveness.
- **Framework:** **React 19** with **Vite** for optimized builds and fast development cycles.
- **Styling:** **Vanilla CSS** with **Glassmorphism** design principles and **Framer Motion** for premium interactive animations.
- **Routing:** **React Router 7** for seamless navigation between the Dashboard, Course Details, and Meeting Rooms.
- **Icons:** **Lucide React** for a clean, consistent, and modern icon set.
- **Key Modules:**
  - `MediaPipe Face Mesh`: Processes webcam frames locally to track 468+ facial landmarks for attention monitoring.
  - `PeerJS`: Manages Peer-to-Peer (P2P) WebRTC connections for real-time video/audio streaming.
  - `YouTube IFrame API`: Orchestrates video playback, allowing the system to pause/play based on student focus.

---

## 3. Backend Infrastructure
A high-performance asynchronous backend designed for scalability and security.
- **API Framework:** **FastAPI (Python 3.10+)**, chosen for its speed and native support for asynchronous operations.
- **Database:** **MongoDB** (NoSQL) for flexible storage of users, course metadata, and granular session logs.
- **Asynchronous Driver:** **Motor** for non-blocking database interactions, ensuring high concurrency.
- **Security:** **JWT (JSON Web Tokens)** for secure, stateless authentication and **Passlib (Bcrypt)** for industry-standard password hashing.
- **Real-time Communication:** **WebSockets** are utilized for signaling during meetings and for broadcasting live distraction alerts to hosts.

---

## 4. InternixaGPT (AI Chatbot)
The chatbot is a sophisticated **RAG (Retrieval-Augmented Generation)** system designed to assist students with course-specific queries.
- **Workflow:**
  1. **Embedding:** User queries are converted into high-dimensional vectors using **Google Gemini API** (`gemini-embedding-001`).
  2. **Retrieval:** The system performs a similarity search in a **Pinecone Vector Database**, which contains indexed transcripts from all course videos.
  3. **Generation:** The retrieved context and user query are sent to **Groq Cloud API** for final response generation.
- **LLM Model:** **Llama-3.3-70b-versatile** (via Groq) provides beginner-friendly, context-aware, and educational answers.
- **Accountability Logic:** The chatbot is **progress-aware**, meaning it can restrict answers to concepts that the student has already "unlocked" by watching the relevant videos.

---

## 5. Internixa Meet (AI-Monitored Video Conferencing)
A custom-built video meeting platform with integrated AI accountability.
- **Networking:** Powered by **WebRTC (via PeerJS)** for secure, encrypted peer-to-peer data transmission.
- **Signaling:** A dedicated **WebSocket** server handles meeting orchestration (join/leave) and live status synchronization.
- **AI Monitoring Features:**
  - **Gaze Tracking:** Real-time detection of whether a participant is looking at the screen or distracted.
  - **Sleep Detection:** Uses **EAR (Eye Aspect Ratio)** to detect drowsiness. If a participant's eyes remain closed for 10 seconds, the system triggers a **loud audio alarm**.
  - **Host Dashboard:** Meeting hosts receive real-time notifications if any participant is flagged as "Distracted" or "Away."
  - **Engagement Scoring:** Calculates an "Active Time" vs. "Total Time" score for every participant.

---

## 6. AI Models & Algorithms
| AI Model / Library | Category | Purpose |
| :--- | :--- | :--- |
| **Llama-3.3-70b** | LLM | Powers InternixaGPT for intelligent, human-like course assistance. |
| **Google Gemini Embedding** | Vectorization | Converts course transcripts and user queries into searchable vectors. |
| **MediaPipe Face Mesh** | Computer Vision | Tracks 468+ facial landmarks at 30+ FPS for sub-second attention analysis. |
| **EAR (Eye Aspect Ratio)** | Math Logic | Custom algorithm calculated from facial landmarks to detect user sleep state. |

---

## 7. APIs & External Integrations
1. **Groq Cloud API:** Provides the high-speed inference engine for the LLM.
2. **Google Generative AI API:** Used for generating high-fidelity text embeddings.
3. **Pinecone API:** Cloud-native vector database for storing and retrieving educational knowledge.
4. **YouTube Data API:** Orchestrates video delivery and synchronizes playback with focus states.
5. **MongoDB Atlas:** Scalable cloud database for all structured persistent data.

---

## 8. Unique Value Proposition
- **Active Pause:** Content only progress when the student is actually focused. Look away, and the learning stops.
- **Integrity Gates:** Integrated **Security Puzzles** (math/logic) ensure that a human is actively present and participating.
- **Data-Driven Certification:** Engagement metrics (Attention Score) are recorded directly on the certificates, ensuring they represent true mastery.

---
**Report generated for InternNixa Project Review - April 2026**
