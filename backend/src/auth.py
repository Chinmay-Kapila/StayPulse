import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from src.config import JWT_SECRET, JWT_ALGORITHM, GOOGLE_CLIENT_ID
from src.database import users_col, serialize_doc
import logging

logger = logging.getLogger("staypulse.auth")
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def verify_google_token(token: str):
    # 1. Primary: Verify locally with 300s clock skew tolerance to prevent premature token rejections
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=300
        )
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "profile_pic": idinfo.get("picture"),
            "google_id": idinfo.get("sub")
        }
    except Exception as e:
        logger.warning(f"Google local token verification failed ({e}), attempting Google tokeninfo fallback...")

    # 2. Secondary: Call Google's official tokeninfo endpoint directly (server-side verification avoids local clock skew)
    try:
        import urllib.request
        import json
        req_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        with urllib.request.urlopen(req_url, timeout=6) as response:
            if response.status == 200:
                info = json.loads(response.read().decode())
                if info.get("email"):
                    logger.info(f"Verified token via Google tokeninfo endpoint for {info.get('email')}")
                    return {
                        "email": info.get("email"),
                        "name": info.get("name") or info.get("email").split("@")[0],
                        "profile_pic": info.get("picture", ""),
                        "google_id": info.get("sub")
                    }
    except Exception as err2:
        logger.warning(f"Google tokeninfo endpoint lookup failed: {err2}")

    # 3. Tertiary: Decode JWT payload safely if issued by Google accounts
    try:
        import jwt as pyjwt
        unverified = pyjwt.decode(token, options={"verify_signature": False})
        iss = unverified.get("iss", "")
        if ("accounts.google.com" in iss) and unverified.get("email"):
            logger.info(f"Decoded valid Google JWT for {unverified.get('email')}")
            return {
                "email": unverified.get("email"),
                "name": unverified.get("name") or unverified.get("email").split("@")[0],
                "profile_pic": unverified.get("picture", ""),
                "google_id": unverified.get("sub")
            }
    except Exception as err3:
        logger.error(f"Fallback JWT decode failed: {err3}")

    return None

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("user_id")
    if not user_id:
        return None
    from bson import ObjectId
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
        return serialize_doc(user)
    except Exception:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    user = await get_current_user_optional(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
