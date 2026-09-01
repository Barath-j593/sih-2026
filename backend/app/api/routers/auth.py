from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas.auth import UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    
    # Also support demo shortcut login for roles
    if not user:
        role_map = {
            "ministry": ("usr-ministry", "MoSPI Central Directorate", "ministry", "National"),
            "state": ("usr-state-bihar", "State Nodal Officer (Bihar)", "state", "Bihar"),
            "district": ("usr-district-darbhanga", "District Magistrate (Darbhanga)", "district", "DARBHANGA"),
            "mp": ("usr-mp-gopal", "Mr Gopal Jee Thakur (MP)", "mp", "Mr Gopal Jee Thakur"),
        }
        if login_data.username in role_map:
            uid, name, role, jur = role_map[login_data.username]
            token = create_access_token(subject=uid, role=role, jurisdiction=jur)
            return Token(
                access_token=token,
                token_type="bearer",
                role=role,
                username=login_data.username,
                full_name=name,
                jurisdiction=jur
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token(
        subject=user.id,
        role=user.role,
        jurisdiction=user.jurisdiction
    )
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        full_name=user.full_name,
        jurisdiction=user.jurisdiction
    )

@router.get("/demo-users")
def get_demo_users():
    return [
        {"role": "ministry", "username": "ministry_admin", "password": "ministry123", "name": "Central Directorate (MoSPI)", "jurisdiction": "National"},
        {"role": "state", "username": "state_nodal_bihar", "password": "state123", "name": "State Nodal Officer (Bihar)", "jurisdiction": "Bihar"},
        {"role": "district", "username": "district_darbhanga", "password": "district123", "name": "District Magistrate (Darbhanga)", "jurisdiction": "DARBHANGA"},
        {"role": "mp", "username": "mp_gopal_jee", "password": "mp123", "name": "Mr Gopal Jee Thakur (MP)", "jurisdiction": "Mr Gopal Jee Thakur"},
    ]
