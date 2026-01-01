from fastapi import APIRouter, HTTPException, status, Request
from typing import List, Optional

from app.models import (
    IntegrationType,
    IntegrationCreate,
    IntegrationResponse,
)
from app.services import get_slack_service, get_teams_service

router = APIRouter(prefix="/integrations", tags=["Integrations"])


# Slack endpoints
@router.post("/slack", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_slack_integration(
    data: IntegrationCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new Slack integration."""
    try:
        service = get_slack_service()
        return await service.create_integration(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/slack", response_model=List[IntegrationResponse])
async def list_slack_integrations(
    # user: dict = Depends(get_current_user),
):
    """List all Slack integrations."""
    service = get_slack_service()
    return await service.list_integrations()


@router.get("/slack/{integration_id}", response_model=IntegrationResponse)
async def get_slack_integration(
    integration_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get a Slack integration by ID."""
    service = get_slack_service()
    result = await service.get_integration(integration_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    return result


@router.delete("/slack/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slack_integration(
    integration_id: str,
    # user: dict = Depends(get_current_user),
):
    """Delete a Slack integration."""
    service = get_slack_service()
    if not await service.delete_integration(integration_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")


@router.post("/slack/{integration_id}/send")
async def send_slack_message(
    integration_id: str,
    channel: str,
    message: str,
    # user: dict = Depends(get_current_user),
):
    """Send a message to a Slack channel."""
    try:
        service = get_slack_service()
        return await service.send_message(integration_id, channel, message)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/slack/events")
async def handle_slack_events(request: Request):
    """Handle Slack events webhook."""
    body = await request.json()
    
    # Handle URL verification challenge
    if body.get("type") == "url_verification":
        return {"challenge": body.get("challenge")}
    
    # Handle events
    event = body.get("event", {})
    event_type = event.get("type")
    
    # Add event handling logic here
    
    return {"status": "ok"}


@router.post("/slack/commands")
async def handle_slack_command(request: Request):
    """Handle Slack slash commands."""
    form = await request.form()
    
    command = form.get("command")
    text = form.get("text", "")
    channel = form.get("channel_id")
    user = form.get("user_id")
    
    # Get the first Slack integration (simplified)
    service = get_slack_service()
    integrations = await service.list_integrations()
    
    if not integrations:
        return {
            "response_type": "ephemeral",
            "text": "No Slack integration configured.",
        }
    
    return await service.handle_command(
        integrations[0].id,
        command,
        text,
        channel,
        user,
    )


# Teams endpoints
@router.post("/teams", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_teams_integration(
    data: IntegrationCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new Teams integration."""
    try:
        service = get_teams_service()
        return await service.create_integration(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/teams", response_model=List[IntegrationResponse])
async def list_teams_integrations(
    # user: dict = Depends(get_current_user),
):
    """List all Teams integrations."""
    service = get_teams_service()
    return await service.list_integrations()


@router.get("/teams/{integration_id}", response_model=IntegrationResponse)
async def get_teams_integration(
    integration_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get a Teams integration by ID."""
    service = get_teams_service()
    result = await service.get_integration(integration_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    return result


@router.delete("/teams/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teams_integration(
    integration_id: str,
    # user: dict = Depends(get_current_user),
):
    """Delete a Teams integration."""
    service = get_teams_service()
    if not await service.delete_integration(integration_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")


@router.post("/teams/{integration_id}/send")
async def send_teams_message(
    integration_id: str,
    message: str,
    title: Optional[str] = None,
    # user: dict = Depends(get_current_user),
):
    """Send a message to Teams."""
    try:
        service = get_teams_service()
        return await service.send_message(integration_id, message, title)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# Combined endpoints
@router.get("", response_model=List[IntegrationResponse])
async def list_all_integrations(
    # user: dict = Depends(get_current_user),
):
    """List all integrations (Slack and Teams)."""
    slack_service = get_slack_service()
    teams_service = get_teams_service()
    
    slack_integrations = await slack_service.list_integrations()
    teams_integrations = await teams_service.list_integrations()
    
    return slack_integrations + teams_integrations
