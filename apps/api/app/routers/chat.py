from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from app.models import (
    ChatRequest,
    ChatResponse,
    ChatMessage,
)
from app.services import get_chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    # user: dict = Depends(get_current_user),
):
    """Send a message to the AI assistant."""
    try:
        service = get_chat_service()
        return await service.send_message(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=List[ChatMessage])
async def get_conversation(
    conversation_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get the messages in a conversation."""
    service = get_chat_service()
    return await service.get_conversation(conversation_id)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    # user: dict = Depends(get_current_user),
):
    """Delete a conversation."""
    service = get_chat_service()
    if not await service.delete_conversation(conversation_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")


@router.get("/suggestions/{data_source_id}", response_model=List[str])
async def get_suggested_questions(
    data_source_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get suggested questions for a data source."""
    service = get_chat_service()
    return await service.get_suggested_questions(data_source_id)
