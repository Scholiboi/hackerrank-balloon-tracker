from fastapi import APIRouter, HTTPException, status
from auth import check_admin_password, create_access_token
from schemas import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    if not check_admin_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )
    token = create_access_token({"sub": "admin"})
    return TokenResponse(access_token=token)
