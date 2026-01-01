import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from app.models import (
    ConnectionStatus,
    IntegrationType,
    SlackConfig,
    IntegrationCreate,
    IntegrationResponse,
)
from app.services.data_source_service import get_data_source_service
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class SlackService:
    """Service for Slack integration."""
    
    def __init__(self):
        # In-memory storage for integrations
        self._integrations: Dict[str, Dict[str, Any]] = {}
        self._clients: Dict[str, WebClient] = {}
    
    async def create_integration(
        self, data: IntegrationCreate
    ) -> IntegrationResponse:
        """Create a new Slack integration."""
        if not data.slack_config:
            raise ValueError("Slack configuration is required")
        
        integration_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Test the connection
        client = WebClient(token=data.slack_config.bot_token)
        try:
            auth_response = client.auth_test()
            status = ConnectionStatus.CONNECTED
        except SlackApiError as e:
            logger.error(f"Slack auth failed: {e}")
            raise ValueError(f"Slack authentication failed: {e.response['error']}")
        
        integration_data = {
            "id": integration_id,
            "type": IntegrationType.SLACK,
            "name": data.name,
            "enabled": data.enabled,
            "config": data.slack_config.model_dump(),
            "status": status,
            "bot_id": auth_response.get("bot_id"),
            "team_id": auth_response.get("team_id"),
            "team_name": auth_response.get("team"),
            "last_message_at": None,
            "created_at": now,
        }
        
        self._integrations[integration_id] = integration_data
        self._clients[integration_id] = client
        
        return self._to_response(integration_data)
    
    async def get_integration(self, integration_id: str) -> Optional[IntegrationResponse]:
        """Get a Slack integration by ID."""
        data = self._integrations.get(integration_id)
        if not data:
            return None
        return self._to_response(data)
    
    async def list_integrations(self) -> List[IntegrationResponse]:
        """List all Slack integrations."""
        return [
            self._to_response(data) 
            for data in self._integrations.values()
            if data["type"] == IntegrationType.SLACK
        ]
    
    async def delete_integration(self, integration_id: str) -> bool:
        """Delete a Slack integration."""
        if integration_id in self._integrations:
            del self._integrations[integration_id]
            if integration_id in self._clients:
                del self._clients[integration_id]
            return True
        return False
    
    async def send_message(
        self,
        integration_id: str,
        channel: str,
        message: str,
        blocks: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Send a message to a Slack channel."""
        client = self._clients.get(integration_id)
        if not client:
            raise ValueError("Integration not found")
        
        try:
            response = client.chat_postMessage(
                channel=channel,
                text=message,
                blocks=blocks,
            )
            
            self._integrations[integration_id]["last_message_at"] = datetime.utcnow()
            
            return {
                "success": True,
                "ts": response["ts"],
                "channel": response["channel"],
            }
        except SlackApiError as e:
            logger.error(f"Slack message failed: {e}")
            raise
    
    async def send_insight(
        self,
        integration_id: str,
        channel: str,
        insight: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send an insight as a formatted Slack message."""
        severity_emoji = {
            "low": "ℹ️",
            "medium": "⚠️",
            "high": "🚨",
            "critical": "🔴",
        }
        
        type_emoji = {
            "trend": "📈",
            "anomaly": "🔍",
            "correlation": "🔗",
            "recommendation": "💡",
            "summary": "📊",
        }
        
        emoji = severity_emoji.get(insight.get("severity", "low"), "ℹ️")
        type_icon = type_emoji.get(insight.get("type", "summary"), "📊")
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji} {insight['title']}",
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": insight["description"],
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"{type_icon} *Type:* {insight.get('type', 'N/A')} | *Confidence:* {insight.get('confidence', 0):.0%}",
                    }
                ]
            },
        ]
        
        # Add metrics if present
        if insight.get("metrics"):
            metrics_text = " | ".join([
                f"*{m['name']}:* {m['value']}{m.get('unit', '')}"
                for m in insight["metrics"]
            ])
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": metrics_text,
                }
            })
        
        return await self.send_message(
            integration_id,
            channel,
            insight["title"],
            blocks=blocks,
        )
    
    async def handle_command(
        self,
        integration_id: str,
        command: str,
        text: str,
        channel: str,
        user: str,
    ) -> Dict[str, Any]:
        """Handle a Slack slash command."""
        if command == "/tuple-query":
            return await self._handle_query_command(integration_id, text, channel)
        elif command == "/tuple-insights":
            return await self._handle_insights_command(integration_id, channel)
        else:
            return {
                "response_type": "ephemeral",
                "text": f"Unknown command: {command}",
            }
    
    async def _handle_query_command(
        self, integration_id: str, query: str, channel: str
    ) -> Dict[str, Any]:
        """Handle a query command."""
        # This would integrate with the chat service
        return {
            "response_type": "in_channel",
            "text": f"Processing query: {query}",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"🔄 *Processing your query...*\n`{query}`",
                    }
                }
            ]
        }
    
    async def _handle_insights_command(
        self, integration_id: str, channel: str
    ) -> Dict[str, Any]:
        """Handle an insights command."""
        return {
            "response_type": "in_channel",
            "text": "Fetching latest insights...",
        }
    
    def _to_response(self, data: Dict[str, Any]) -> IntegrationResponse:
        """Convert internal data to response model."""
        return IntegrationResponse(
            id=data["id"],
            type=data["type"],
            name=data["name"],
            enabled=data["enabled"],
            status=data["status"],
            last_message_at=data.get("last_message_at"),
            created_at=data["created_at"],
        )


# Singleton instance
_slack_service: Optional[SlackService] = None


def get_slack_service() -> SlackService:
    """Get the Slack service singleton."""
    global _slack_service
    if _slack_service is None:
        _slack_service = SlackService()
    return _slack_service
