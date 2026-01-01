from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from app.models import (
    InsightResponse,
    GenerateInsightsRequest,
    InsightType,
    InsightSeverity,
)
from app.services import get_insight_service

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.post("/generate", response_model=List[InsightResponse])
async def generate_insights(
    request: GenerateInsightsRequest,
    # user: dict = Depends(get_current_user),
):
    """Generate AI-powered insights for a data source."""
    try:
        service = get_insight_service()
        return await service.generate_insights(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=List[InsightResponse])
async def list_insights(
    data_source_id: Optional[str] = None,
    insight_type: Optional[InsightType] = None,
    severity: Optional[InsightSeverity] = None,
    # user: dict = Depends(get_current_user),
):
    """List insights with optional filters."""
    service = get_insight_service()
    return await service.list_insights(data_source_id, insight_type, severity)


@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(
    insight_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get an insight by ID."""
    service = get_insight_service()
    result = await service.get_insight(insight_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")
    return result


@router.post("/{insight_id}/acknowledge")
async def acknowledge_insight(
    insight_id: str,
    # user: dict = Depends(get_current_user),
):
    """Mark an insight as acknowledged."""
    service = get_insight_service()
    if not await service.acknowledge_insight(insight_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")
    return {"status": "acknowledged"}


@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(
    insight_id: str,
    # user: dict = Depends(get_current_user),
):
    """Delete an insight."""
    service = get_insight_service()
    if not await service.delete_insight(insight_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")
