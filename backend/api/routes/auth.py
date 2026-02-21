from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.security.access_control import AuthManager
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login", tags=["Auth"])
async def login(request: LoginRequest):
    # Mock user storage for demonstration
    # In production, fetch from MongoDB
    mock_users = {
        "admin": {"password_hash": AuthManager.get_password_hash("admin123"), "role": "admin"},
        "officer": {"password_hash": AuthManager.get_password_hash("officer123"), "role": "compliance_officer"}
    }
    
    user = mock_users.get(request.username)
    if not user or not AuthManager.verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = AuthManager.create_access_token(data={"sub": request.username, "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}
