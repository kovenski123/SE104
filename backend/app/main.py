from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routers import (
    auth, users, fields, bookings, services,
    invoices, memberships, shifts, feedbacks, reports
)

# Tạo tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sân Bóng API",
    description="API quản lý đặt lịch và vận hành sân bóng",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(fields.router)
app.include_router(bookings.router)
app.include_router(services.router)
app.include_router(invoices.router)
app.include_router(memberships.router)
app.include_router(shifts.router)
app.include_router(feedbacks.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {
        "name": "San Bong API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
