from fastapi import APIRouter
from ..models.auth import UserRegister, UserLogin, GoogleLoginRequest
from ..crud import auth

router = APIRouter(prefix="/auth")

@router.post('/register')
async def register(user: UserRegister) -> dict:
    return auth.register(user.username, user.email, user.password)

@router.post('/login')
async def login(user: UserLogin) -> dict:
    return auth.login(user.login_identifier, user.password)

@router.post('/login/google')
async def google_login(payload: GoogleLoginRequest) -> dict:
    return auth.google_login(payload.token)