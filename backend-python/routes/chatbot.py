from fastapi import APIRouter, HTTPException, Depends
from middleware.auth import get_current_user
from config import get_db
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from pinecone import Pinecone
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Clients
pc = None
def get_pinecone():
    global pc
    if pc is None:
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="PINECONE_API_KEY is not set")
        pc = Pinecone(api_key=api_key)
    return pc

def get_genai():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")
    genai.configure(api_key=api_key)
    return genai

class SearchRequest(BaseModel):
    vector: List[float]
    topK: Optional[int] = 5

class EmbedRequest(BaseModel):
    text: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    context: Optional[str] = ""
    history: Optional[List[Message]] = []
    courseId: Optional[str] = None
    moduleId: Optional[str] = None

@router.post("/search")
async def search_pinecone(request: SearchRequest):
    try:
        index_name = os.getenv("PINECONE_INDEX_NAME")
        if not index_name:
            return {"error": "PINECONE_INDEX_NAME is not set"}

        client = get_pinecone()
        index = client.Index(index_name)

        query_response = index.query(
            vector=request.vector,
            top_k=request.topK,
            include_metadata=True
        )

        return query_response.to_dict()
    except Exception as e:
        print(f"Pinecone Search Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embed")
async def generate_embedding(request: EmbedRequest):
    try:
        # Check if key is available
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
             raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set in Environment Variables")

        genai_client = get_genai()
        # Using the universal stable model: embedding-001
        result = genai_client.embed_content(
            model="models/embedding-001",
            content=request.text,
            task_type="retrieval_query",
        )
        return {"embedding": result['embedding']}
    except Exception as e:
        print(f"--- [CRITICAL] Gemini Embedding Error ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Details: {str(e)}")
        print(f"----------------------------------------")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_groq(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

        # 1. Domain Restriction Check
        ALLOWED_COURSE_IDS = [
            "sql-course", "python-course", "tableau-course", "powerbi-course",
            "data-analyst-bootcamp", "data-science-specialization"
        ]
        
        # 1. Domain Restriction Check (Heuristic for educational context)
        ALLOWED_KEYWORDS = ["sql", "python", "tableau", "power bi", "bootcamp", "data science", "data analyst", "mysql", "database", "programming", "visualization"]
        is_educational = any(kw in request.query.lower() for kw in ALLOWED_KEYWORDS)
        
        # We'll let the LLM handle the final domain enforcement but keep the progress check logic
        is_in_scope = is_educational or (request.courseId in ALLOWED_COURSE_IDS)
        
        if request.context and request.context != "No relevant context found.":
            for cid in ALLOWED_COURSE_IDS:
                if cid.split('-')[0].lower() in request.context.lower():
                    is_in_scope = True
                    break

        # 2. Context-Aware Logic & Progress Check
        progress_msg = ""
        if request.courseId:
            enrollment = await db["enrollments"].find_one({
                "userId": current_user["_id"],
                "courseId": request.courseId
            })
            
            if enrollment:
                completed_modules = enrollment.get("completedModules", [])
                
                # Check if context belongs to a locked module
                # Note: This assumes search results metadata like [Source: vid-...] matches module IDs
                if request.context:
                    import re
                    sources = re.findall(r"\[Source: (vid-[^\]]+)\]", request.context)
                    if sources:
                        source_vid = sources[0]
                        # If the source video is NOT the current one and NOT in completed list, it's locked
                        if source_vid != request.moduleId and source_vid not in completed_modules:
                            # We might need to check the module order to see if it's truly "locked" (unwatched)
                            return {"text": "Please complete previous videos to unlock this concept."}

        system_instruction = f"""
        You are InternixaGPT, a premium AI learning assistant for INTERNIXA platform.
        STRICT RULES:
        1. Answer ONLY questions related to these courses: SQL, Python, Tableau, Power BI, Data Analyst Bootcamp, Data Science Specialization.
        2. Use ONLY the provided context from video transcripts and course notes.
        3. Response Style: Simple English, short, clear, beginner-friendly. Use examples from the context.
        4. If the question is outside the course syllabus or unrelated to INTERNIXA, say: "I'm designed to help only with INTERNIXA course content. Please ask questions related to your enrolled courses."
        
        USER CONTEXT:
        - Course: {request.courseId or 'General'}
        - Current Module: {request.moduleId or 'None'}
        - Retreived Course Data: {request.context or "No specific course data found."}
        """

        messages = [
            {"role": "system", "content": system_instruction}
        ]
        
        if request.history:
            for h in request.history:
                messages.append({"role": h.role, "content": h.content})
        
        messages.append({"role": "user", "content": request.query})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "stream": False,
                    "temperature": 0.3
                },
                timeout=30.0
            )

        if response.status_code != 200:
            error_data = response.json()
            raise HTTPException(status_code=response.status_code, detail=error_data.get("error", {}).get("message", "Groq API Error"))

        result = response.json()
        return {"text": result['choices'][0]['message']['content']}
    except Exception as e:
        print(f"Groq Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
