from typing import Annotated
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    username: Annotated[str, Field(min_length=1)] | None = None
    email: Annotated[EmailStr, Field()] | None = None
    password: Annotated[str, Field(min_length=1)]

class UserLogin(BaseModel):
    login_identifier: Annotated[str, Field(min_length=1)]
    password: Annotated[str, Field(min_length=1)]

class GoogleLoginRequest(BaseModel):
    token: Annotated[str, Field(min_length=1)]