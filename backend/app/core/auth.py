from dotenv import load_dotenv
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash
from datetime import datetime, timedelta, timezone
from jwt.exceptions import InvalidTokenError
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import os

# load env variables
load_dotenv()

# JWT auth
JWT_SECRET = os.getenv("JWT_KEY")
if not JWT_SECRET:
    raise RuntimeError("JWT_KEY environment variable is required")
ALGORITHM = "HS256"

# instantiate password hasher
ph: PasswordHasher = PasswordHasher()

# hash the password entered when registering
def hash_password(password: str) -> str:
    return ph.hash(password)

# verify login password with stored hash in DB
def verify_password(password: str, stored_hash: str) -> bool:
    try:
        ph.verify(stored_hash, password)
        return True

    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False

# create JWT token
def create_jwt_token(user_id: str) -> str:
    # JWT structure (base64) header.payload.signature

    payload: dict = {
        "user_id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60)
    }

    # return final JWT string
    token: str = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
    return token

# extract user_id from received token
def decode_jwt_token(token: str) -> str | None:
    try:
        payload: str = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[ALGORITHM] 
        )

        user_id = payload.get("user_id")
        return user_id if isinstance(user_id, str) and user_id else None

    except InvalidTokenError:
        return None

# GOOGLE OAuth2
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")

def verify_google_token(token: str) -> dict | None:
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        return id_info
    
    except Exception:
        return None
