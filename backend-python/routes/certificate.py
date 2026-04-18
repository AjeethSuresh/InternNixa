import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from bson import ObjectId
from middleware.auth import get_current_user
from config import get_db
from utils.generate_certificate import generate_certificate

router = APIRouter()

@router.get("/download/{filename}")
async def download_certificate(filename: str, current_user: dict = Depends(get_current_user)):
    # The static files directory
    cert_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "certificates")
    file_path = os.path.join(cert_dir, filename)
    
    # 1. If file exists, return it immediately
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            media_type='application/pdf',
            filename=filename,
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    
    # 2. If file missing (e.g. after Render restart), attempt to REGENERATE on the fly
    db = get_db()
    
    # Find the certificate record in DB
    cert_record = await db["certificates"].find_one({
        "filePath": filename,
        "userId": current_user["_id"]
    })
    
    if not cert_record:
        raise HTTPException(status_code=404, detail="Certificate record not found in database")
        
    # Find the corresponding session for data
    session_id = cert_record.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=404, detail="Session link missing in certificate record")
        
    session = await db["sessions"].find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Original session record not found")
        
    try:
        # Regenerate the file with the ORIGINAL certificate ID
        await generate_certificate(
            current_user, 
            session, 
            session.get("courseTitle", "Professional Training"),
            cert_record.get("certificateId")
        )
        
        # Verify it was created
        if os.path.exists(file_path):
            return FileResponse(
                path=file_path,
                media_type='application/pdf',
                filename=filename
            )
        else:
            raise HTTPException(status_code=500, detail="Regeneration failed to produce a file")
            
    except Exception as e:
        print(f"Error regenerating certificate: {e}")
        raise HTTPException(status_code=500, detail="Failed to regenerate missing certificate file")
