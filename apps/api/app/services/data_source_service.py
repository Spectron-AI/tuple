import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from app.models import (
    DataSourceType,
    ConnectionStatus,
    DataSourceCreate,
    DataSourceUpdate,
    DataSourceResponse,
    DatabaseSchema,
    QueryResult,
    QueryColumn,
    SampleDataResponse,
)
from app.connectors import get_connector
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class DataSourceService:
    """Service for managing data sources."""
    
    def __init__(self):
        # In-memory storage for demo purposes
        # In production, use a proper database
        self._data_sources: Dict[str, Dict[str, Any]] = {}
        self._schemas: Dict[str, DatabaseSchema] = {}
    
    async def create_data_source(self, data: DataSourceCreate) -> DataSourceResponse:
        """Create a new data source."""
        source_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Test connection first
        connector = get_connector(data.type, data.config)
        success, error = await connector.test_connection()
        
        if not success:
            raise ValueError(f"Connection failed: {error}")
        
        # Store the data source
        source_data = {
            "id": source_id,
            "name": data.name,
            "type": data.type,
            "description": data.description,
            "config": data.config.model_dump(),
            "status": ConnectionStatus.CONNECTED,
            "schema_data": None,
            "last_synced": None,
            "created_at": now,
            "updated_at": now,
        }
        
        self._data_sources[source_id] = source_data
        
        # Sync schema in background (simplified for now)
        try:
            async with connector:
                schema = await connector.get_schema()
                self._schemas[source_id] = schema
                source_data["schema_data"] = schema
                source_data["last_synced"] = datetime.utcnow()
        except Exception as e:
            logger.warning(f"Failed to sync schema: {e}")
        
        return self._to_response(source_data)
    
    async def get_data_source(self, source_id: str) -> Optional[DataSourceResponse]:
        """Get a data source by ID."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            return None
        return self._to_response(source_data)
    
    async def list_data_sources(self) -> List[DataSourceResponse]:
        """List all data sources."""
        return [self._to_response(s) for s in self._data_sources.values()]
    
    async def update_data_source(
        self, source_id: str, data: DataSourceUpdate
    ) -> Optional[DataSourceResponse]:
        """Update a data source."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            return None
        
        if data.name is not None:
            source_data["name"] = data.name
        if data.description is not None:
            source_data["description"] = data.description
        if data.config is not None:
            source_data["config"] = data.config.model_dump()
        
        source_data["updated_at"] = datetime.utcnow()
        
        return self._to_response(source_data)
    
    async def delete_data_source(self, source_id: str) -> bool:
        """Delete a data source."""
        if source_id in self._data_sources:
            del self._data_sources[source_id]
            if source_id in self._schemas:
                del self._schemas[source_id]
            return True
        return False
    
    async def test_connection(self, source_id: str) -> Dict[str, Any]:
        """Test the connection to a data source."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            return {"success": False, "error": "Data source not found"}
        
        from app.models import ConnectionConfig
        config = ConnectionConfig(**source_data["config"])
        connector = get_connector(source_data["type"], config)
        
        success, error = await connector.test_connection()
        
        if success:
            source_data["status"] = ConnectionStatus.CONNECTED
        else:
            source_data["status"] = ConnectionStatus.ERROR
        
        return {"success": success, "error": error}
    
    async def sync_schema(self, source_id: str) -> DatabaseSchema:
        """Sync the schema for a data source."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            raise ValueError("Data source not found")
        
        from app.models import ConnectionConfig
        config = ConnectionConfig(**source_data["config"])
        connector = get_connector(source_data["type"], config)
        
        source_data["status"] = ConnectionStatus.SYNCING
        
        try:
            async with connector:
                schema = await connector.get_schema()
                self._schemas[source_id] = schema
                source_data["schema_data"] = schema
                source_data["last_synced"] = datetime.utcnow()
                source_data["status"] = ConnectionStatus.CONNECTED
                return schema
        except Exception as e:
            source_data["status"] = ConnectionStatus.ERROR
            raise
    
    async def execute_query(
        self, source_id: str, query: str, limit: int = 100, timeout: int = 30
    ) -> QueryResult:
        """Execute a query on a data source."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            raise ValueError("Data source not found")
        
        from app.models import ConnectionConfig
        config = ConnectionConfig(**source_data["config"])
        connector = get_connector(source_data["type"], config)
        
        async with connector:
            columns, rows, exec_time = await connector.execute_query(query, limit, timeout)
            
            return QueryResult(
                columns=columns,
                rows=rows,
                row_count=len(rows),
                execution_time_ms=exec_time,
                query=query,
            )
    
    async def execute_nl_query(
        self, source_id: str, question: str
    ) -> QueryResult:
        """Execute a natural language query."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            raise ValueError("Data source not found")
        
        # Get schema
        schema = self._schemas.get(source_id)
        if not schema:
            schema = await self.sync_schema(source_id)
        
        # Convert to SQL
        llm = get_llm_service()
        result = await llm.natural_language_to_sql(
            question=question,
            schema=schema,
            dialect=self._get_dialect(source_data["type"]),
        )
        
        sql = result["sql"]
        explanation = result.get("explanation", "")
        
        # Execute the generated SQL
        query_result = await self.execute_query(source_id, sql)
        query_result.generated_sql = sql
        query_result.explanation = explanation
        
        return query_result
    
    async def get_sample_data(
        self, source_id: str, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> SampleDataResponse:
        """Get sample data from a table."""
        source_data = self._data_sources.get(source_id)
        if not source_data:
            raise ValueError("Data source not found")
        
        from app.models import ConnectionConfig
        config = ConnectionConfig(**source_data["config"])
        connector = get_connector(source_data["type"], config)
        
        async with connector:
            columns, rows = await connector.get_sample_data(table_name, sample_size, random_sample)
            
            # Calculate basic statistics
            statistics = self._calculate_statistics(columns, rows)
            
            return SampleDataResponse(
                data_source_id=source_id,
                table_name=table_name,
                sample_size=len(rows),
                columns=columns,
                rows=rows,
                statistics=statistics,
            )
    
    def _to_response(self, data: Dict[str, Any]) -> DataSourceResponse:
        """Convert internal data to response model."""
        from app.models import ConnectionConfig
        return DataSourceResponse(
            id=data["id"],
            name=data["name"],
            type=data["type"],
            description=data["description"],
            config=ConnectionConfig(**data["config"]),
            status=data["status"],
            schema_data=data.get("schema_data"),
            last_synced=data.get("last_synced"),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )
    
    def _get_dialect(self, data_type: DataSourceType) -> str:
        """Get SQL dialect for a data source type."""
        dialects = {
            DataSourceType.POSTGRESQL: "postgresql",
            DataSourceType.MYSQL: "mysql",
            DataSourceType.SQLITE: "sqlite",
            DataSourceType.SNOWFLAKE: "snowflake",
            DataSourceType.BIGQUERY: "bigquery",
            DataSourceType.REDSHIFT: "redshift",
        }
        return dialects.get(data_type, "sql")
    
    def _calculate_statistics(
        self, columns: List[QueryColumn], rows: List[List[Any]]
    ) -> Dict[str, Any]:
        """Calculate basic statistics for sample data."""
        if not rows:
            return {}
        
        stats = {}
        for i, col in enumerate(columns):
            col_values = [row[i] for row in rows if row[i] is not None]
            
            col_stats = {
                "null_count": len(rows) - len(col_values),
                "distinct_count": len(set(str(v) for v in col_values)),
            }
            
            # Numeric statistics
            if col.type in ["integer", "number"]:
                numeric_values = [v for v in col_values if isinstance(v, (int, float))]
                if numeric_values:
                    col_stats["min"] = min(numeric_values)
                    col_stats["max"] = max(numeric_values)
                    col_stats["avg"] = sum(numeric_values) / len(numeric_values)
            
            # String statistics
            elif col.type == "string":
                string_values = [str(v) for v in col_values]
                if string_values:
                    col_stats["min_length"] = min(len(s) for s in string_values)
                    col_stats["max_length"] = max(len(s) for s in string_values)
            
            stats[col.name] = col_stats
        
        return stats


# Singleton instance
_data_source_service: Optional[DataSourceService] = None


def get_data_source_service() -> DataSourceService:
    """Get the data source service singleton."""
    global _data_source_service
    if _data_source_service is None:
        _data_source_service = DataSourceService()
    return _data_source_service
