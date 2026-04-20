from fastapi import APIRouter, Depends, HTTPException
from typing import List

from config import get_db
from middleware.auth import get_current_user
from utils.courses_data import COURSES
from utils.legacy_courses import LEGACY_COURSES

ALL_COURSES = LEGACY_COURSES + COURSES

router = APIRouter()

@router.get("")
@router.get("/")
async def get_all_courses():
    # Return minimal course info (no modules) for the dashboard
    minimal_courses = []
    for c in ALL_COURSES:
        c_data = {
            "id": c["id"],
            "title": c["title"],
            "description": c["description"],
            "image": c["image"],
        }
        if c.get("isDemo"):
            c_data["isDemo"] = True
            c_data["modules"] = c.get("modules", [])
            
        minimal_courses.append(c_data)
    return minimal_courses

@router.get("/{course_id}")
async def get_course_detail(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # 1. Find course
    course = next((c for c in ALL_COURSES if c["id"] == course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # 2. Get user enrollment
    enrollment = await db["enrollments"].find_one({
        "userId": current_user["_id"],
        "courseId": course_id
    })
    
    completed_modules = enrollment.get("completedModules", []) if enrollment else []
    
    # 3. Apply locking logic to modules
    # A module is unlocked if it is the first module, OR if the previous module is in completed_modules.
    modules_with_state = []
    
    for i, module in enumerate(course["modules"]):
        mod_copy = dict(module)
        
        # God Mode / Elite Bypass for Ajeeth
        if current_user.get("email") == "ajeethsuresh02@gmail.com":
            mod_copy["isCompleted"] = True
            mod_copy["isLocked"] = False
        else:
            mod_copy["isCompleted"] = module["id"] in completed_modules
            # Locking Logic
            if i == 0:
                mod_copy["isLocked"] = False
            else:
                prev_module_id = course["modules"][i-1]["id"]
                if prev_module_id in completed_modules:
                    mod_copy["isLocked"] = False
                else:
                    mod_copy["isLocked"] = True
                
        modules_with_state.append(mod_copy)
        
    # Reassemble course payload
    result = dict(course)
    result["modules"] = modules_with_state
    
    if enrollment:
        enrollment["_id"] = str(enrollment["_id"])
        
    # Calculate attendance based on session history
    sessions_cursor = db["sessions"].find({
        "userId": current_user["_id"],
        "courseId": course_id
    })
    course_sessions = await sessions_cursor.to_list(length=1000)
    total_time_sec = sum(s.get("totalTime", 0) for s in course_sessions)
    
    # Target for 100% attendance = 10 hours (36000 seconds)
    attendance_pct = min(100, round((total_time_sec / 36000) * 100))

    progress_pct = round((len(completed_modules) / len(result["modules"])) * 100) if len(result["modules"]) > 0 else 0
    if current_user.get("email") == "ajeethsuresh02@gmail.com":
        progress_pct = 100
        attendance_pct = 100

    return {
        "course": result,
        "enrollment": enrollment,
        "progressPercentage": progress_pct,
        "attendancePercentage": attendance_pct,
        "totalTimeFocused": total_time_sec
    }
