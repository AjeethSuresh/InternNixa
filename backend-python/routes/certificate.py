import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from middleware.auth import get_current_user

router = APIRouter()

@router.get("/download/{filename}")
async def download_certificate(filename: str, current_user: dict = Depends(get_current_user)):
    # The static files directory
    cert_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "certificates")
    file_path = os.path.join(cert_dir, filename)
    
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
    else:
        raise HTTPException(status_code=404, detail="Certificate not found")
