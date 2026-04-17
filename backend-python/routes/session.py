import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from config import get_db
from middleware.auth import get_current_user
from utils.generate_certificate import generate_certificate
from utils.generate_summary import generate_smart_summary

router = APIRouter()

@router.get("/summary/download/{filename}")
async def download_summary(filename: str):
    file_path = os.path.join("summaries", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Summary not found")
    return FileResponse(file_path, media_type='application/pdf', filename=filename)

@router.post("/generate-summary/{session_id}")
async def create_summary(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    
    session = await db["sessions"].find_one({"_id": ObjectId(session_id), "userId": current_user["_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Check if already exists
        existing = await db["summaries"].find_one({"sessionId": session_id})
        if existing:
            return {"summaryUrl": f"/api/session/summary/download/{existing['filePath']}"}

        result = await generate_smart_summary(
            current_user["name"],
            session.get("courseTitle", "General Course"),
            session.get("moduleId", "Module Content"),
            session.get("engagementScore", 0),
            session.get("activeTime", 0)
        )
        
        summary_record = {
            "userId": current_user["_id"],
            "sessionId": session_id,
            "filePath": result["fileName"],
            "generatedAt": datetime.utcnow()
        }
        await db["summaries"].insert_one(summary_record)
        
        return {"summaryUrl": f"/api/session/summary/download/{result['fileName']}"}
    except Exception as e:
        print(f"Summary Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI summary")

class SessionComplete(BaseModel):
    totalTime: float
    activeTime: float
    warnings: int
    courseTitle: Optional[str] = "Professional Training"
    courseId: Optional[str] = None
    moduleId: Optional[str] = None
    totalModules: Optional[int] = None
    watchPercentage: Optional[float] = 100.0  # default to 100 for backward compatibility

@router.post("/complete")
async def complete_session(
    session_data: SessionComplete, 
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    total_time = session_data.totalTime
    active_time = session_data.activeTime
    
    engagement_score = (active_time / total_time * 100) if total_time > 0 else 0
    engagement_score = round(engagement_score)
    
    # Calculate Focus Points (FP)
    # 1 FP for every 30 seconds of active time
    base_fp = int(active_time // 30)
    
    # Bonus points for high engagement
    bonus_fp = 0
    if engagement_score >= 90 and session_data.watchPercentage >= 90:
        bonus_fp = 50
    elif engagement_score >= 75:
        bonus_fp = 20
        
    focus_points = base_fp + bonus_fp
    
    session_record = {
        "userId": current_user["_id"],
        "totalTime": total_time,
        "activeTime": active_time,
        "warnings": session_data.warnings,
        "engagementScore": engagement_score,
        "watchPercentage": session_data.watchPercentage,
        "focusPoints": focus_points,
        "courseTitle": session_data.courseTitle,
        "completedAt": datetime.utcnow()
    }
    
    result = await db["sessions"].insert_one(session_record)
    session_id = str(result.inserted_id)
    session_record["_id"] = session_id

    # Update global user focus points
    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"totalFocusPoints": focus_points}}
    )
    
    # Update enrollment progress
    enrollment_status = None
    if session_data.courseId and session_data.moduleId:
        enrollment = await db["enrollments"].find_one({
            "userId": current_user["_id"],
            "courseId": session_data.courseId
        })
        
        if enrollment:
            completed_modules = enrollment.get("completedModules", [])
            # Mark module as completed ONLY if watch percentage >= 90
            if session_data.moduleId not in completed_modules and session_data.watchPercentage >= 90.0:
                completed_modules.append(session_data.moduleId)
                
                update_data = {"completedModules": completed_modules}
                
                # Check if all modules are completed
                if session_data.totalModules and len(completed_modules) >= session_data.totalModules:
                    update_data["status"] = "completed"
                    enrollment_status = "completed"
                else:
                    enrollment_status = enrollment.get("status", "enrolled")
                
                await db["enrollments"].update_one(
                    {"_id": enrollment["_id"]},
                    {"$set": update_data}
                )
            else:
                enrollment_status = enrollment.get("status", "enrolled")
        else:
            # If not enrolled, maybe they are just viewing. No progress update.
            enrollment_status = "not_enrolled"

    eligible = False
    certificate_url = None
    
    # Eligibility logic: score >= 75 and warnings <= 5 
    # We now allow certificates for individual session excellence if they watched the module
    is_module_completed = session_data.watchPercentage >= 90.0

    if engagement_score >= 75 and session_data.warnings <= 5 and is_module_completed:
        eligible = True
        
        # Generate the certificate PDF with error handling
        try:
            cert_result = await generate_certificate(current_user, session_record, session_data.courseTitle)
            
            certificate_record = {
                "userId": current_user["_id"],
                "sessionId": session_id,
                "certificateId": cert_result["certificateId"],
                "filePath": cert_result["fileName"]
            }
            await db["certificates"].insert_one(certificate_record)
            
            certificate_url = f"/api/certificates/download/{cert_result['fileName']}"
        except Exception as e:
            print(f"Error generating certificate: {e}")
            eligible = False # Mark as ineligible if generation failed
            certificate_url = None
        
    return {
        "session": session_record,
        "eligible": eligible,
        "certificateUrl": certificate_url,
        "enrollmentStatus": enrollment_status,
        "focusPointsEarned": focus_points
    }

@router.get("/leaderboard")
async def get_leaderboard():
    db = get_db()
    
    # Fetch top 10 users by totalFocusPoints
    cursor = db["users"].find(
        {"totalFocusPoints": {"$exists": True}},
        {"name": 1, "totalFocusPoints": 1, "_id": 0}
    ).sort("totalFocusPoints", -1).limit(10)
    
    leaderboard = await cursor.to_list(length=10)
    return leaderboard

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Aggregate to join sessions with certificates
    pipeline = [
        {"$match": {"userId": current_user["_id"]}},
        {"$sort": {"completedAt": -1}},
        {
            "$lookup": {
                "from": "certificates",
                "let": {"sessionId": {"$toString": "$_id"}}, 
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$sessionId", "$$sessionId"]}}}
                ],
                "as": "certificate"
            }
        },
        {
            "$addFields": {
                "certificateUrl": {
                    "$cond": {
                        "if": {"$gt": [{"$size": "$certificate"}, 0]},
                        "then": {"$concat": ["/api/certificates/download/", {"$arrayElemAt": ["$certificate.filePath", 0]}]},
                        "else": None
                    }
                }
            }
        },
        {"$project": {"certificate": 0}}
    ]
    
    history_cursor = db["sessions"].aggregate(pipeline)
    history = await history_cursor.to_list(length=100)
    
    # Need to convert ObjectId to string for JSON serialization
    for item in history:
        item["_id"] = str(item["_id"])
        
    return history
