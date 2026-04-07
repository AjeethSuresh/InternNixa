import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from config import get_db
from middleware.auth import get_current_user
from utils.generate_certificate import generate_certificate

router = APIRouter()

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
    
    session_record = {
        "userId": current_user["_id"],
        "totalTime": total_time,
        "activeTime": active_time,
        "warnings": session_data.warnings,
        "engagementScore": engagement_score,
        "watchPercentage": session_data.watchPercentage,
        "courseTitle": session_data.courseTitle,
        "completedAt": datetime.utcnow()
    }
    
    result = await db["sessions"].insert_one(session_record)
    session_id = str(result.inserted_id)
    session_record["_id"] = session_id
    
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

    eligible = False
    certificate_url = None
    
    # Eligibility logic: score >= 75 and warnings <= 5 AND course is completed (if applicable)
    is_course_completed = (enrollment_status == "completed") if enrollment_status else True

    if engagement_score >= 75 and session_data.warnings <= 5 and is_course_completed:
        eligible = True
        
        # Generate the certificate PDF
        cert_result = await generate_certificate(current_user, session_record, session_data.courseTitle)
        
        certificate_record = {
            "userId": current_user["_id"],
            "sessionId": session_id,
            "certificateId": cert_result["certificateId"],
            "filePath": cert_result["fileName"]
        }
        await db["certificates"].insert_one(certificate_record)
        
        certificate_url = f"/api/certificates/download/{cert_result['fileName']}"
        
    return {
        "session": session_record,
        "eligible": eligible,
        "certificateUrl": certificate_url,
        "enrollmentStatus": enrollment_status
    }

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
