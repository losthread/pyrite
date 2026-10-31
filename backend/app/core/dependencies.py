from fastapi import HTTPException, Header
from .auth import decode_jwt_token

# exract user_id from http header
def get_user_id(authorization: str | None = Header(None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = token.strip()
    user_id = decode_jwt_token(token)

    if user_id is None:
        raise HTTPException(status_code = 401, detail = "Invalid or expired token")

    return user_id
