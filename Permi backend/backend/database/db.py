
import sqlite3
from pathlib import Path

# Database file will be created inside the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "permishield.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                scan_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                app_name TEXT NOT NULL,
                package_name TEXT,
                purpose TEXT,
                category TEXT,
                analysis_type TEXT NOT NULL,
                analysis_status TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                permissions_checked INTEGER NOT NULL,
                permissions_found TEXT NOT NULL,
                findings TEXT NOT NULL,
                suspicious_combinations TEXT NOT NULL,
                summary TEXT,
                limitations TEXT
            )
        """)
        connection.commit()
    finally:
        connection.close()
