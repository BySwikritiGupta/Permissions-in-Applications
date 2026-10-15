
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from database.db import initialize_db

app = FastAPI(
    title="App Guard API",
    description="Android Application Permission Risk Analysis",
    version="1.0.0"
)

# Allow requests from the React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Connect API routes
app.include_router(router, prefix="/api/v1")


# Initialize database when the server starts
@app.on_event("startup")
def startup_event():
    initialize_db()


@app.get("/")
def home():
    return {
        "message": "Welcome to App Guard API",
        "status": "running",
        "version": "1.0.0"
    }
