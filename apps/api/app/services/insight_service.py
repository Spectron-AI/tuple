import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from app.models import (
    InsightType,
    InsightSeverity,
    InsightMetric,
    InsightCreate,
    InsightResponse,
    GenerateInsightsRequest,
)
from app.services.data_source_service import get_data_source_service
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class InsightService:
    """Service for managing AI-generated insights."""
    
    def __init__(self):
        # In-memory storage for demo purposes
        self._insights: Dict[str, Dict[str, Any]] = {}
    
    async def generate_insights(
        self, request: GenerateInsightsRequest
    ) -> List[InsightResponse]:
        """Generate insights for a data source."""
        ds_service = get_data_source_service()
        llm_service = get_llm_service()
        
        # Get data source
        source = await ds_service.get_data_source(request.data_source_id)
        if not source:
            raise ValueError("Data source not found")
        
        # Get schema
        schema = source.schema_data
        if not schema:
            schema = await ds_service.sync_schema(request.data_source_id)
        
        # Get sample data from each table
        sample_data = {}
        for table in schema.tables[:5]:  # Limit to first 5 tables
            try:
                sample = await ds_service.get_sample_data(
                    request.data_source_id,
                    table.name,
                    sample_size=50,
                )
                # Convert to list of dicts for LLM
                rows_as_dicts = []
                for row in sample.rows:
                    row_dict = {
                        col.name: row[i] for i, col in enumerate(sample.columns)
                    }
                    rows_as_dicts.append(row_dict)
                sample_data[table.name] = rows_as_dicts
            except Exception as e:
                logger.warning(f"Failed to get sample from {table.name}: {e}")
        
        # Generate insights using LLM
        raw_insights = await llm_service.analyze_data_for_insights(
            schema=schema,
            sample_data=sample_data,
            focus_areas=request.focus_areas,
            max_insights=request.max_insights,
        )
        
        # Store and return insights
        insights = []
        for raw in raw_insights:
            insight_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Parse metrics
            metrics = []
            for m in raw.get("metrics", []):
                metrics.append(InsightMetric(
                    name=m.get("name", ""),
                    value=m.get("value"),
                    change=m.get("change"),
                    unit=m.get("unit"),
                ))
            
            insight_data = {
                "id": insight_id,
                "title": raw.get("title", "Untitled Insight"),
                "description": raw.get("description", ""),
                "type": InsightType(raw.get("type", "summary")),
                "severity": InsightSeverity(raw.get("severity", "low")),
                "confidence": raw.get("confidence", 0.5),
                "metrics": metrics,
                "data_source_id": request.data_source_id,
                "sql_query": raw.get("sql_query"),
                "created_at": now,
                "acknowledged": False,
            }
            
            self._insights[insight_id] = insight_data
            insights.append(self._to_response(insight_data))
        
        return insights
    
    async def get_insight(self, insight_id: str) -> Optional[InsightResponse]:
        """Get an insight by ID."""
        insight_data = self._insights.get(insight_id)
        if not insight_data:
            return None
        return self._to_response(insight_data)
    
    async def list_insights(
        self,
        data_source_id: Optional[str] = None,
        insight_type: Optional[InsightType] = None,
        severity: Optional[InsightSeverity] = None,
    ) -> List[InsightResponse]:
        """List insights with optional filters."""
        insights = []
        
        for insight_data in self._insights.values():
            if data_source_id and insight_data["data_source_id"] != data_source_id:
                continue
            if insight_type and insight_data["type"] != insight_type:
                continue
            if severity and insight_data["severity"] != severity:
                continue
            
            insights.append(self._to_response(insight_data))
        
        # Sort by created_at descending
        insights.sort(key=lambda x: x.created_at, reverse=True)
        
        return insights
    
    async def acknowledge_insight(self, insight_id: str) -> bool:
        """Mark an insight as acknowledged."""
        if insight_id in self._insights:
            self._insights[insight_id]["acknowledged"] = True
            return True
        return False
    
    async def delete_insight(self, insight_id: str) -> bool:
        """Delete an insight."""
        if insight_id in self._insights:
            del self._insights[insight_id]
            return True
        return False
    
    def _to_response(self, data: Dict[str, Any]) -> InsightResponse:
        """Convert internal data to response model."""
        return InsightResponse(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            type=data["type"],
            severity=data["severity"],
            confidence=data["confidence"],
            metrics=data["metrics"],
            data_source_id=data["data_source_id"],
            sql_query=data.get("sql_query"),
            created_at=data["created_at"],
            acknowledged=data["acknowledged"],
        )


# Singleton instance
_insight_service: Optional[InsightService] = None


def get_insight_service() -> InsightService:
    """Get the insight service singleton."""
    global _insight_service
    if _insight_service is None:
        _insight_service = InsightService()
    return _insight_service
