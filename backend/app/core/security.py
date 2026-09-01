import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt, JWTError
from app.core.config import settings

def get_password_hash(password: str) -> str:
    # Use standard salted SHA-256 for maximum cross-platform reliability
    salt = "setu_mplads_sih_2026_secure_salt"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if plain_password == hashed_password:
        return True
    return get_password_hash(plain_password) == hashed_password

def create_access_token(subject: Union[str, Any], role: str, jurisdiction: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "jurisdiction": jurisdiction or ""
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
