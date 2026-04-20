from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional

from config import get_db, JWT_SECRET
from middleware.auth import get_current_user

# Setup bcrypt for hashing passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    db = get_db()
    
    # Check if user exists
    user_exists = await db["users"].find_one({"email": user.email})
    if user_exists:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = pwd_context.hash(user.password)
    
    # Create user
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "isVerified": user.role == "student", # Students are default verified, recruiters are NOT
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db["users"].insert_one(new_user)
    user_id = str(result.inserted_id)
    
    return {
        "_id": user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "isVerified": new_user["isVerified"],
        "token": create_access_token({"id": user_id})
    }

@router.post("/login")
async def login(user: UserLogin):
    db = get_db()
    
    db_user = await db["users"].find_one({"email": user.email})
    print(db_user)
    
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    user_id = str(db_user["_id"])
    
    return {
        "_id": user_id,
        "name": db_user["name"],
        "email": db_user["email"],
        "role": db_user.get("role", "student"),
        "isVerified": db_user.get("isVerified", False),
        "token": create_access_token({"id": user_id})
    }

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user
