from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import department, student, course, enrollment, rag

# Database tables creation
Base.metadata.create_all(bind=engine)

app = FastAPI(title="University Course Enrollment System")

# CORS Middleware Setup (Fixes 405 Method Not Allowed & Network Error)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(department.router)
app.include_router(student.router)
app.include_router(course.router)
app.include_router(enrollment.router)

# UniAssist AI - additive RAG endpoint (POST /api/chat)
app.include_router(rag.router)