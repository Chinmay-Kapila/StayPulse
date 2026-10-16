from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from src.database import users_col, serialize_doc
from src.schemas import GoogleAuthRequest, DevTokenRequest, EmailSignInRequest
from src.auth import verify_google_token, create_access_token, get_current_user
import logging

logger = logging.getLogger("staypulse.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

ADMIN_EMAILS = {"jesusfromrehab@gmail.com"}

@router.post("/google")
def google_auth(payload: GoogleAuthRequest):
    """
    Authenticate with Google OAuth ID token (GIS).
    Checks whether the email has role='admin' in the database (or hardcoded primary admin).
    """
    user_info = verify_google_token(payload.credential)
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid Google OAuth credential")

    email = user_info["email"].strip().lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    # Check database for user and their stored role
    user = users_col.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})

    if not user:
        # Determine role: only designated admins get admin role
        assigned_role = "admin" if email in ADMIN_EMAILS else "user"
        user_doc = {
            "email": email,
            "name": user_info.get("name", email.split("@")[0]),
            "profile_pic": user_info.get("profile_pic", ""),
            "role": assigned_role,
            "google_id": user_info.get("google_id"),
            "created_at": now_iso
        }
        res = users_col.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id
        user = user_doc
    else:
        # If user is in ADMIN_EMAILS, ensure their DB role is updated to admin
        if email in ADMIN_EMAILS and user.get("role") != "admin":
            users_col.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
            user["role"] = "admin"

        # Update profile pic if changed
        if user_info.get("profile_pic"):
            users_col.update_one({"_id": user["_id"]}, {"$set": {"profile_pic": user_info["profile_pic"]}})
            user["profile_pic"] = user_info["profile_pic"]

    token = create_access_token({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "user")
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_doc(user)
    }

@router.post("/signin-email", summary="Direct Google Account / Email Authentication")
def signin_with_email(payload: EmailSignInRequest):
    """
    Direct Google Account / Email Sign-in.
    Checks MongoDB for user role:
    - If email == jesusfromrehab@gmail.com, role is admin.
    - If user exists in DB, checks whether they are admin or user.
    - If new user, creates user with role='user'.
    """
    email = payload.email.strip().lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    user = users_col.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})

    if not user:
        assigned_role = "admin" if email in ADMIN_EMAILS else "user"
        user_doc = {
            "email": email,
            "name": payload.name or email.split("@")[0].capitalize(),
            "profile_pic": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80" if assigned_role == "admin" else "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80",
            "role": assigned_role,
            "created_at": now_iso
        }
        res = users_col.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id
        user = user_doc
    else:
        if email in ADMIN_EMAILS and user.get("role") != "admin":
            users_col.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
            user["role"] = "admin"

    token = create_access_token({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "user")
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_doc(user)
    }

@router.post("/dev-token", summary="Developer JWT Token Generator for Swagger Testing")
def generate_dev_token(payload: DevTokenRequest):
    """
    Dev endpoint to generate a valid JWT Bearer token for Swagger/OpenAPI testing.
    Input: email, name, role ('admin' or 'user').
    Returns access_token to use with the Swagger 'Authorize' button.
    """
    email = payload.email.strip().lower()
    now_iso = datetime.now(timezone.utc).isoformat()
    
    user = users_col.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
    target_role = payload.role if payload.role in ["admin", "user"] else ("admin" if email in ADMIN_EMAILS else "user")

    if not user:
        user_doc = {
            "email": email,
            "name": payload.name or email.split("@")[0],
            "profile_pic": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80" if target_role == "admin" else "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80",
            "role": target_role,
            "created_at": now_iso
        }
        res = users_col.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id
        user = user_doc
    else:
        if user.get("role") != target_role:
            users_col.update_one({"_id": user["_id"]}, {"$set": {"role": target_role}})
            user["role"] = target_role

    token = create_access_token({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "user")
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_doc(user)
    }

@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve logged in user profile."""
    return current_user
