"""
Database configuration. Hỗ trợ cả SQLite (default) và MySQL.

Sử dụng SQLite (mặc định, dễ dev):
    Không cần làm gì, tự động dùng san_bong.db

Sử dụng MySQL:
    1. Cài đặt MySQL server và tạo database:
        CREATE DATABASE san_bong CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    2. Cài driver: pip install pymysql
    3. Set env var DATABASE_URL trong .env hoặc shell:
        DATABASE_URL=mysql+pymysql://user:password@host:port/san_bong
       Ví dụ:
        DATABASE_URL=mysql+pymysql://root:123456@localhost:3306/san_bong
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Đọc DATABASE_URL từ env var; fallback SQLite
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./san_bong.db"
)

# SQLite cần connect_args đặc biệt; MySQL không
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine_kwargs = {
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # MySQL: cấu hình pool để xử lý connection drops + utf8mb4
    engine_kwargs.update({
        "pool_pre_ping": True,    # ping trước mỗi request để detect dead connection
        "pool_recycle": 3600,     # recycle connection sau 1h tránh timeout MySQL (default 8h)
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_info() -> dict:
    """Debug helper: trả về thông tin database hiện tại đang dùng."""
    url = engine.url
    return {
        "driver": url.drivername,
        "database": url.database,
        "host": url.host,
        "port": url.port,
        "is_sqlite": is_sqlite,
    }
