from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException

from app.core import auth
from app.core.dependencies import get_user_id


def test_jwt_round_trip():
    token = auth.create_jwt_token("user-123")
    assert auth.decode_jwt_token(token) == "user-123"


def test_decode_rejects_invalid_expired_and_missing_user_id():
    expired = jwt.encode(
        {"user_id": "user-123", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )
    missing_user_id = jwt.encode(
        {"exp": datetime.now(timezone.utc) + timedelta(minutes=1)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )

    assert auth.decode_jwt_token("not-a-token") is None
    assert auth.decode_jwt_token(expired) is None
    assert auth.decode_jwt_token(missing_user_id) is None


def test_get_user_id_accepts_bearer_token():
    token = auth.create_jwt_token("user-123")
    assert get_user_id(f"Bearer {token}") == "user-123"


def test_get_user_id_rejects_missing_or_invalid_token():
    for authorization in (None, "Basic abc", "Bearer ", "Bearer invalid"):
        try:
            get_user_id(authorization)
            assert False, f"Expected HTTP 401 for {authorization!r}"
        except HTTPException as exc:
            assert exc.status_code == 401
