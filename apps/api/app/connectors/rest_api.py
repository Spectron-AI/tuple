import time
from typing import Any, Dict, List, Optional, Tuple
import logging
import httpx

from app.models import (
    ConnectionConfig,
    TableSchema,
    ColumnSchema,
    DatabaseSchema,
    QueryColumn,
)
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class RESTAPIConnector(BaseConnector):
    """Connector for REST API data sources."""
    
    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None
        self._cached_data: Optional[List[Dict]] = None
    
    async def connect(self) -> bool:
        """Initialize the HTTP client."""
        try:
            headers = self.config.headers or {}
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"
            
            self._client = httpx.AsyncClient(
                base_url=self.config.api_url,
                headers=headers,
                timeout=30.0,
            )
            
            # Test with a simple request
            response = await self._client.get("")
            response.raise_for_status()
            
            # Cache the initial data
            data = response.json()
            if isinstance(data, list):
                self._cached_data = data
            elif isinstance(data, dict) and 'data' in data:
                self._cached_data = data['data'] if isinstance(data['data'], list) else [data['data']]
            else:
                self._cached_data = [data]
            
            logger.info(f"REST API connection established, fetched {len(self._cached_data)} records")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to REST API: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
            self._cached_data = None
            logger.info("REST API connection closed")
    
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """Test the REST API connection."""
        try:
            headers = self.config.headers or {}
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.config.api_url,
                    headers=headers,
                )
                response.raise_for_status()
            
            return True, None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return False, "Authentication failed - invalid API key"
            elif e.response.status_code == 403:
                return False, "Access forbidden"
            elif e.response.status_code == 404:
                return False, "API endpoint not found"
            return False, f"HTTP {e.response.status_code}: {e.response.text}"
        except httpx.ConnectError:
            return False, f"Could not connect to {self.config.api_url}"
        except httpx.TimeoutException:
            return False, "Connection timed out"
        except Exception as e:
            return False, str(e)
    
    def _infer_type_from_value(self, value: Any) -> str:
        """Infer the data type from a value."""
        if value is None:
            return "null"
        elif isinstance(value, bool):
            return "boolean"
        elif isinstance(value, int):
            return "integer"
        elif isinstance(value, float):
            return "number"
        elif isinstance(value, str):
            return "string"
        elif isinstance(value, list):
            return "array"
        elif isinstance(value, dict):
            return "object"
        else:
            return "string"
    
    async def get_schema(self) -> DatabaseSchema:
        """Infer schema from the API response."""
        if self._cached_data is None:
            await self.connect()
        
        if not self._cached_data:
            return DatabaseSchema(tables=[])
        
        # Infer columns from the data
        field_types: Dict[str, set] = {}
        for record in self._cached_data[:100]:  # Sample first 100 records
            if isinstance(record, dict):
                for key, value in record.items():
                    if key not in field_types:
                        field_types[key] = set()
                    field_types[key].add(self._infer_type_from_value(value))
        
        columns = []
        for field_name, types in field_types.items():
            if len(types) == 1:
                field_type = types.pop()
            else:
                field_type = "mixed"
            
            columns.append(
                ColumnSchema(
                    name=field_name,
                    type=field_type,
                    nullable=True,
                )
            )
        
        table_schema = TableSchema(
            name="data",
            columns=columns,
            row_count=len(self._cached_data),
        )
        
        return DatabaseSchema(tables=[table_schema])
    
    async def execute_query(
        self, query: str, limit: int = 100, timeout: int = 30
    ) -> Tuple[List[QueryColumn], List[List[Any]], int]:
        """
        Execute a query on the REST API data.
        Query format: endpoint?params or JSONPath expression
        """
        if self._client is None:
            await self.connect()
        
        start_time = time.time()
        
        try:
            # If query looks like an endpoint, fetch new data
            if query.startswith('/') or query.startswith('http'):
                response = await self._client.get(query)
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, list):
                    records = data[:limit]
                elif isinstance(data, dict) and 'data' in data:
                    records = data['data'][:limit] if isinstance(data['data'], list) else [data['data']]
                else:
                    records = [data]
            else:
                # Use cached data with simple filtering
                records = self._filter_cached_data(query, limit)
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            if not records:
                return [], [], execution_time_ms
            
            # Extract columns from first record
            first_record = records[0]
            columns = [
                QueryColumn(name=key, type=self._infer_type_from_value(value))
                for key, value in first_record.items()
            ]
            
            # Convert records to rows
            rows = []
            for record in records:
                row = [record.get(col.name) for col in columns]
                rows.append(row)
            
            return columns, rows, execution_time_ms
            
        except Exception as e:
            logger.error(f"REST API query failed: {e}")
            raise
    
    def _filter_cached_data(self, query: str, limit: int) -> List[Dict]:
        """Filter cached data using simple key=value syntax."""
        if not self._cached_data:
            return []
        
        # Parse simple filter syntax: key=value
        filters = {}
        for part in query.split('&'):
            if '=' in part:
                key, value = part.split('=', 1)
                filters[key.strip()] = value.strip()
        
        if not filters:
            return self._cached_data[:limit]
        
        filtered = []
        for record in self._cached_data:
            if isinstance(record, dict):
                match = True
                for key, value in filters.items():
                    if key in record and str(record[key]) != value:
                        match = False
                        break
                if match:
                    filtered.append(record)
                    if len(filtered) >= limit:
                        break
        
        return filtered
    
    async def get_sample_data(
        self, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> Tuple[List[QueryColumn], List[List[Any]]]:
        """Get sample data from the cached API response."""
        if self._cached_data is None:
            await self.connect()
        
        if not self._cached_data:
            return [], []
        
        import random
        
        if random_sample and len(self._cached_data) > sample_size:
            samples = random.sample(self._cached_data, sample_size)
        else:
            samples = self._cached_data[:sample_size]
        
        if not samples:
            return [], []
        
        columns = [
            QueryColumn(name=key, type=self._infer_type_from_value(value))
            for key, value in samples[0].items()
        ]
        
        rows = []
        for record in samples:
            row = [record.get(col.name) for col in columns]
            rows.append(row)
        
        return columns, rows
