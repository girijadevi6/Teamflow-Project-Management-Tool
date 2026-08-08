from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the speaker: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or question")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation history")


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI assistant response message")
