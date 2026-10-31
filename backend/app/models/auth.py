import re
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator

_PASSWORD_RE = re.compile(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$")


class UserRegister(BaseModel):
    username: Annotated[str, Field(min_length=1)] | None = None
    email: Annotated[EmailStr, Field()] | None = None
    password: Annotated[str, Field(min_length=1)]

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not _PASSWORD_RE.match(value):
            raise ValueError(
                "Password must be at least 10 characters and include uppercase, "
                "lowercase, a digit, and a symbol"
            )
        return value


class UserLogin(BaseModel):
    login_identifier: Annotated[str, Field(min_length=1)]
    password: Annotated[str, Field(min_length=1)]


class GoogleLoginRequest(BaseModel):
    token: Annotated[str, Field(min_length=1)]
