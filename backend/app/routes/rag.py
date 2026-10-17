from fastapi import APIRouter

from app.schemas.rag import ChatRequest, ChatResponse
from app.services import rag_service

router = APIRouter(
    prefix="/api",
    tags=["UniAssist AI"],
)


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return rag_service.answer_question(request.message)
