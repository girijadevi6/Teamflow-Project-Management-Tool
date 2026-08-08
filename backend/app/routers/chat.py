from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.ai_context_service import build_authorized_live_context
from ..services.groq_service import generate_chat_response

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleaned_message = payload.message.strip() if payload.message else ""
    if not cleaned_message:
        return ChatResponse(response="Please enter a question.")

    # 1. Build live database context strictly scoped to the authenticated user's authorization
    live_context = build_authorized_live_context(db, current_user)

    # 2. Call Groq service combining knowledge base + live context
    ai_response = generate_chat_response(
        user_message=cleaned_message,
        live_context=live_context,
        conversation_history=payload.history,
    )

    return ChatResponse(response=ai_response)
