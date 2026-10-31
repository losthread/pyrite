import sqlite3
from uuid import uuid4

from fastapi import HTTPException, status
from pydantic import EmailStr

from ..core.config import get_connection
from ..core.auth import (
    hash_password,
    verify_password,
    create_jwt_token,
    verify_google_token,
)

# Used to equalize timing when the user doesn't exist, so response time
# doesn't reveal which accounts are registered.
_DUMMY_HASH = hash_password("dummy-password-for-timing")


def _normalize_email(email: str) -> str:
    return str(email).strip().lower()


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )


def register(username: str | None, email: EmailStr, password: str) -> dict:
    username = username.strip() if username else None
    username = username or None  # empty string -> NULL

    # Usernames containing "@" could impersonate an email at login.
    if username and "@" in username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot contain '@'",
        )

    normalized_email = _normalize_email(email)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        hashed_password = hash_password(password)
        user_id = str(uuid4())

        cursor.execute(
            """
                INSERT INTO users(user_id, username, email, hashed_password, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (user_id, username, normalized_email, hashed_password),
        )

        conn.commit()
        return {"user_id": user_id}

    except sqlite3.IntegrityError as exc:
        conn.rollback()

        if "UNIQUE constraint failed" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email or username already exists",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database constraint violation",
        )

    except sqlite3.Error:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )

    finally:
        cursor.close()
        conn.close()


def login(login_identifier: str, password: str) -> dict:
    login_identifier = login_identifier.strip()

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # One unambiguous lookup path: emails contain "@", usernames can't.
        if "@" in login_identifier:
            cursor.execute(
                "SELECT user_id, hashed_password FROM users WHERE email = ?",
                (_normalize_email(login_identifier),),
            )
        else:
            cursor.execute(
                "SELECT user_id, hashed_password FROM users WHERE username = ?",
                (login_identifier,),
            )

        row = cursor.fetchone()

        if row is None:
            verify_password(password, _DUMMY_HASH)  # timing equalization
            raise _invalid_credentials()

        user_id = str(row[0])
        stored_password_hash = row[1]

        # Google-only account (no password set). Same generic error as a wrong
        # password so login doesn't reveal that the account exists.
        if stored_password_hash is None:
            verify_password(password, _DUMMY_HASH)
            raise _invalid_credentials()

        if not verify_password(password, stored_password_hash):
            raise _invalid_credentials()

        token = create_jwt_token(user_id)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user_id,
        }

    except sqlite3.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )

    finally:
        cursor.close()
        conn.close()


def google_login(google_token: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()

    try:
        id_info = verify_google_token(google_token)

        if not id_info or not id_info.get("email_verified"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )

        email = _normalize_email(id_info["email"])

        cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()

        if row is None:
            user_id = str(uuid4())

            try:
                cursor.execute(
                    """
                        INSERT INTO users(user_id, username, email, hashed_password, created_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (user_id, None, email, None),
                )
                conn.commit()

            except sqlite3.IntegrityError:
                # Concurrent first login for the same email: the other request
                # won the insert, so use that row instead of failing.
                conn.rollback()
                cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
                row = cursor.fetchone()

                if row is None:
                    raise  # a different constraint failed; outer handler deals with it

                user_id = str(row[0])

        else:
            user_id = str(row[0])

            # Password signup never verified this email. Now that Google has
            # proven ownership, drop any password set by an unverified
            # registrant so it can't be used to access this account.
            cursor.execute(
                """
                    UPDATE users
                    SET hashed_password = NULL
                    WHERE user_id = ? AND hashed_password IS NOT NULL
                """,
                (user_id,),
            )
            conn.commit()

        token = create_jwt_token(user_id)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user_id,
        }

    except ValueError:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    except sqlite3.IntegrityError as exc:
        conn.rollback()
        if "UNIQUE constraint failed" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database constraint violation",
        )

    except sqlite3.Error:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )

    finally:
        cursor.close()
        conn.close()