import os
import sqlite3

DB_PATH = os.getenv("DB_PATH", "app.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


if __name__ == "__main__":
    gen = get_db()
    assert next(gen).execute("select 1").fetchone()[0] == 1
    gen.close()
    print("db ok:", DB_PATH)
