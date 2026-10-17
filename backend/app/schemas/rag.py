from pydantic import BaseModel, Field, field_validator

from app.rag.config import MAX_QUESTION_LENGTH


class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's question for UniAssist AI.")

    @field_validator("message")
    @classmethod
    def message_must_be_meaningful(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("message must not be empty")
        if len(cleaned) > MAX_QUESTION_LENGTH:
            raise ValueError(f"message must be at most {MAX_QUESTION_LENGTH} characters")
        return cleaned


class SourceItem(BaseModel):
    document: str
    chunk_id: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem]
