import sqlite3

conn = sqlite3.connect("database.db", check_same_thread=False)
conn.execute("PRAGMA foreign_keys = ON")

conn.execute(
    """
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """
)

conn.commit()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect("database.db")
    connection.execute("PRAGMA foreign_keys = ON")
    return connection