import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

import httpx

from app.models import (
    ConnectionStatus,
    IntegrationType,
    TeamsConfig,
    IntegrationCreate,
    IntegrationResponse,
)

logger = logging.getLogger(__name__)


class TeamsService:
    """Service for Microsoft Teams integration."""
    
    def __init__(self):
        # In-memory storage for integrations
        self._integrations: Dict[str, Dict[str, Any]] = {}
    
    async def create_integration(
        self, data: IntegrationCreate
    ) -> IntegrationResponse:
        """Create a new Teams integration."""
        if not data.teams_config:
            raise ValueError("Teams configuration is required")
        
        integration_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Test the webhook
        try:
            await self._test_webhook(data.teams_config.webhook_url)
            status = ConnectionStatus.CONNECTED
        except Exception as e:
            logger.error(f"Teams webhook test failed: {e}")
            raise ValueError(f"Teams webhook test failed: {str(e)}")
        
        integration_data = {
            "id": integration_id,
            "type": IntegrationType.TEAMS,
            "name": data.name,
            "enabled": data.enabled,
            "config": data.teams_config.model_dump(),
            "status": status,
            "last_message_at": None,
            "created_at": now,
        }
        
        self._integrations[integration_id] = integration_data
        
        return self._to_response(integration_data)
    
    async def get_integration(self, integration_id: str) -> Optional[IntegrationResponse]:
        """Get a Teams integration by ID."""
        data = self._integrations.get(integration_id)
        if not data:
            return None
        return self._to_response(data)
    
    async def list_integrations(self) -> List[IntegrationResponse]:
        """List all Teams integrations."""
        return [
            self._to_response(data) 
            for data in self._integrations.values()
            if data["type"] == IntegrationType.TEAMS
        ]
    
    async def delete_integration(self, integration_id: str) -> bool:
        """Delete a Teams integration."""
        if integration_id in self._integrations:
            del self._integrations[integration_id]
            return True
        return False
    
    async def _test_webhook(self, webhook_url: str) -> bool:
        """Test the Teams webhook with a simple message."""
        test_card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": "Tuple Connection Test",
            "sections": [{
                "activityTitle": "✅ Tuple Connected",
                "activitySubtitle": "Your Tuple integration is working!",
                "text": "You will now receive data insights and notifications in this channel.",
            }],
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=test_card,
                timeout=10,
            )
            response.raise_for_status()
        
        return True
    
    async def send_message(
        self,
        integration_id: str,
        message: str,
        title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a message to Teams via webhook."""
        data = self._integrations.get(integration_id)
        if not data:
            raise ValueError("Integration not found")
        
        webhook_url = data["config"]["webhook_url"]
        
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": title or "Tuple Notification",
            "sections": [{
                "activityTitle": title or "Tuple",
                "text": message,
            }],
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=card,
                    timeout=10,
                )
                response.raise_for_status()
            
            self._integrations[integration_id]["last_message_at"] = datetime.utcnow()
            
            return {"success": True}
        except httpx.HTTPError as e:
            logger.error(f"Teams message failed: {e}")
            raise
    
    async def send_insight(
        self,
        integration_id: str,
        insight: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send an insight as a formatted Teams message."""
        data = self._integrations.get(integration_id)
        if not data:
            raise ValueError("Integration not found")
        
        webhook_url = data["config"]["webhook_url"]
        
        # Build adaptive card sections
        severity_colors = {
            "low": "default",
            "medium": "warning",
            "high": "attention",
            "critical": "attention",
        }
        
        type_icons = {
            "trend": "📈",
            "anomaly": "🔍",
            "correlation": "🔗",
            "recommendation": "💡",
            "summary": "📊",
        }
        
        color = severity_colors.get(insight.get("severity", "low"), "default")
        icon = type_icons.get(insight.get("type", "summary"), "📊")
        
        facts = [
            {"name": "Type", "value": insight.get("type", "N/A").title()},
            {"name": "Severity", "value": insight.get("severity", "N/A").title()},
            {"name": "Confidence", "value": f"{insight.get('confidence', 0):.0%}"},
        ]
        
        # Add metrics to facts
        for metric in insight.get("metrics", []):
            value = str(metric["value"])
            if metric.get("change"):
                value += f" ({metric['change']:+.1f}%)"
            if metric.get("unit"):
                value += f" {metric['unit']}"
            facts.append({"name": metric["name"], "value": value})
        
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "0076D7" if color == "default" else "FF9800" if color == "warning" else "FF5252",
            "summary": insight["title"],
            "sections": [
                {
                    "activityTitle": f"{icon} {insight['title']}",
                    "activitySubtitle": f"Data Insight from Tuple",
                    "facts": facts,
                    "text": insight["description"],
                }
            ],
        }
        
        # Add action to view in Tuple
        if insight.get("id"):
            card["potentialAction"] = [{
                "@type": "OpenUri",
                "name": "View in Tuple",
                "targets": [{"os": "default", "uri": f"https://app.tuple.io/insights/{insight['id']}"}],
            }]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=card,
                    timeout=10,
                )
                response.raise_for_status()
            
            self._integrations[integration_id]["last_message_at"] = datetime.utcnow()
            
            return {"success": True}
        except httpx.HTTPError as e:
            logger.error(f"Teams insight message failed: {e}")
            raise
    
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
_teams_service: Optional[TeamsService] = None


def get_teams_service() -> TeamsService:
    """Get the Teams service singleton."""
    global _teams_service
    if _teams_service is None:
        _teams_service = TeamsService()
    return _teams_service
