from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from bson import ObjectId

from config import get_db, JWT_SECRET

bearer_scheme = HTTPBearer()

ALGORITHM = "HS256"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token payload missing user ID")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token format or secret")

    db = get_db()
    user = await db["users"].find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if user is None:
        raise HTTPException(status_code=401, detail=f"User with ID {user_id} not found in database")

    user["_id"] = str(user["_id"])
    return user
