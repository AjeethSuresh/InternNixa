# TECHNICAL REPORT: INTERNIXA AI-MONITORED E-LEARNING ECOSYSTEM

## 1. Executive Summary
**INTERNIXA** is an advanced AI-driven educational platform designed to address the critical gap in remote learning: **Student Accountability**. Unlike traditional Learning Management Systems (LMS), INTERNIXA utilizes real-time Computer Vision and Generative AI to ensure that students are not only present but actively engaged with the course material.

---

## 2. System Architecture
The platform follows a modern decoupled architecture:
- **Frontend:** React 19 (Vite) + TailwindCSS for a responsive, glassmorphism UI.
- **AI Monitoring:** MediaPipe Face Mesh (Client-side) for low-latency gaze and attention tracking.
- **Backend:** FastAPI (Python 3.10) for high-performance asynchronous operations.
- **Knowledge Engine:** RAG (Retrieval-Augmented Generation) using Pinecone Vector DB and Gemini/Groq LLMs.
- **Database:** MongoDB for persistence of user progress, enrollments, and analytics.

---

## 3. Mathematical Foundations of AI Monitoring

### 3.1 Face Landmark Detection
The system uses the **MediaPipe Face Mesh** model, which estimates 468 3D facial landmarks. The model uses a deep learning architecture based on a sub-millisecond neural network.

The landmarks are represented as a set of points $P = \{p_1, p_2, ..., p_{468}\}$, where each $p_i = (x, y, z)$.

### 3.2 Eye Aspect Ratio (EAR) for Drowsiness Detection
To detect if a student has closed their eyes for an extended period (drowsiness), we calculate the **Eye Aspect Ratio (EAR)**.

For each eye, we select 6 specific landmarks. Let $p_1, ..., p_6$ be the landmarks around the eye.
The EAR is calculated as:
$$EAR = \frac{||p_2 - p_6|| + ||p_3 - p_5||}{2 ||p_1 - p_4||}$$

Where:
- $||p_i - p_j||$ is the Euclidean distance between points $i$ and $j$.
- The numerator represents the vertical distance between eyelids.
- The denominator represents the horizontal length of the eye.

**Decision Logic:**
If $EAR < \text{Threshold}$ (typically 0.22) for more than $N$ frames, the system triggers a "Drowsiness Alert."

### 3.3 Attention & Gaze Tracking (Geometric Projection)
The platform determines if the user is "Looking Forward" by calculating the displacement of the nose tip relative to the midpoint of the eyes.

Let:
- $L = (x_l, y_l)$ be the Left Eye center.
- $R = (x_r, y_r)$ be the Right Eye center.
- $N = (x_n, y_n)$ be the Nose Tip.

The midpoint between eyes $M$ is:
$$M_x = \frac{x_l + x_r}{2}$$

The Horizontal Deviation $\Delta H$ is:
$$\Delta H = |x_n - M_x|$$

The user is considered **Focused** if:
$$\Delta H \leq 0.35 \times |x_r - x_l|$$

This normalized threshold ensures that the sensitivity remains constant regardless of the user's distance from the camera.

---

## 4. Generative AI & RAG Ecosystem

### 4.1 Embedding Space & Vector Search
The ChatBot uses **Retrieval-Augmented Generation (RAG)** to provide answers strictly restricted to course content.

1. **Text Chunking:** Course transcripts are broken into chunks $C_i$.
2. **Embedding Generation:** Each chunk is converted into a high-dimensional vector $V_i$ using **Gemini Embedding-001**.
   $$V = f_{\text{gemini}}(\text{Text})$$
3. **Similarity Search:** When a user asks a query $Q$, its vector $V_Q$ is compared against all $V_i$ using **Cosine Similarity**:
   $$\text{similarity}(V_Q, V_i) = \frac{V_Q \cdot V_i}{||V_Q|| \, ||V_i||}$$

### 4.2 Large Language Model (LLM) Reasoning
The system utilizes **Llama 3.3 (70B)** via Groq for high-speed reasoning. The retrieved context is injected into the system prompt:
$$\text{Response} = \mathcal{G}(\text{System Prompt} + \text{Retrieved Context} + \text{User Query})$$

---

## 5. Security & Integrity Mechanisms

### 5.1 Asymmetric Debouncing
To prevent false negatives (e.g., brief blinks causing a "No Face" alert), the system implements an asymmetric debounce logic:
- **Face Found:** Immediate state update ($t \approx 0$ms).
- **Face Lost:** Delayed state update ($t = 800$ms).

### 5.2 Integrity Gates (Puzzle Modals)
If the user accumulates 3 warnings or leaves the browser tab, the platform triggers a **Security Puzzle**. This forces human interaction and cognitive engagement before content can be resumed.

---

## 6. Certification & Analytics Engine
Upon completion, the backend calculates the **Final Engagement Score**:
$$ES = \left( \frac{\text{Active Time}}{\text{Total Session Time}} \right) \times 100$$

A certificate is only generated if $ES \geq 75\%$. The PDF is dynamically composed using the **ReportLab** library, embedding a unique UUID and a verified digital seal.

---

## 7. Conclusion
INTERNIXA represents a paradigm shift in E-learning by combining **Computer Vision (MediaPipe)**, **Vector Search (Pinecone)**, and **LLMs (Groq/Gemini)**. The result is a platform that transforms passive video consumption into a high-accountability, interactive learning experience.
