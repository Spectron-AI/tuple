import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from app.models import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    QueryResult,
)
from app.services.data_source_service import get_data_source_service
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling AI-powered data chat."""
    
    def __init__(self):
        # In-memory storage for conversations
        self._conversations: Dict[str, List[Dict[str, Any]]] = {}
    
    async def send_message(
        self,
        request: ChatRequest,
    ) -> ChatResponse:
        """Send a message and get an AI response."""
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get or create conversation history
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []
        
        history = self._conversations[conversation_id]
        
        # Add user message to history
        user_message = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        history.append(user_message)
        
        # Get data source if specified
        schema = None
        if request.data_source_id:
            ds_service = get_data_source_service()
            source = await ds_service.get_data_source(request.data_source_id)
            if source and source.schema_data:
                schema = source.schema_data
        
        # Generate AI response
        llm_service = get_llm_service()
        
        if schema:
            # Chat with data context
            response = await llm_service.chat_with_data(
                message=request.message,
                schema=schema,
                conversation_history=history[:-1],  # Exclude current message
            )
        else:
            # General chat without data context
            response = await self._general_chat(request.message, history[:-1])
        
        # Execute SQL if generated
        query_result = None
        if response.get("sql_query") and request.data_source_id:
            try:
                ds_service = get_data_source_service()
                query_result = await ds_service.execute_query(
                    request.data_source_id,
                    response["sql_query"],
                )
            except Exception as e:
                logger.warning(f"Failed to execute generated SQL: {e}")
        
        # Add assistant message to history
        assistant_message = {
            "role": "assistant",
            "content": response["message"],
            "timestamp": datetime.utcnow().isoformat(),
            "sql_query": response.get("sql_query"),
        }
        history.append(assistant_message)
        
        return ChatResponse(
            message=response["message"],
            conversation_id=conversation_id,
            sql_query=response.get("sql_query"),
            results=query_result,
            suggestions=response.get("suggestions"),
        )
    
    async def get_conversation(
        self, conversation_id: str
    ) -> List[ChatMessage]:
        """Get the messages in a conversation."""
        history = self._conversations.get(conversation_id, [])
        
        messages = []
        for msg in history:
            messages.append(ChatMessage(
                role=msg["role"],
                content=msg["content"],
                timestamp=datetime.fromisoformat(msg["timestamp"]),
                sql_query=msg.get("sql_query"),
            ))
        
        return messages
    
    async def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation."""
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
            return True
        return False
    
    async def get_suggested_questions(
        self, data_source_id: str
    ) -> List[str]:
        """Get suggested questions for a data source."""
        ds_service = get_data_source_service()
        source = await ds_service.get_data_source(data_source_id)
        
        if not source or not source.schema_data:
            return [
                "What tables are available?",
                "Show me a sample of the data",
                "What are the key metrics?",
            ]
        
        # Generate suggestions based on schema
        tables = [t.name for t in source.schema_data.tables[:5]]
        suggestions = [
            f"What data is in the {tables[0]} table?" if tables else "What tables are available?",
            "Show me the top 10 records",
            "What are the trends in the data?",
            "Find any anomalies in the data",
            "Summarize the data quality",
        ]
        
        return suggestions
    
    async def _general_chat(
        self, message: str, history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle general chat without data context."""
        # Simple fallback when no data source is selected
        return {
            "message": "Please select a data source to start analyzing your data. "
                      "Once connected, I can help you explore your data, run queries, "
                      "and generate insights.",
            "suggestions": [
                "Connect to a PostgreSQL database",
                "Upload a CSV file",
                "Connect to a REST API",
            ],
        }


# Singleton instance
_chat_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    """Get the chat service singleton."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
