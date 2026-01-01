from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
import logging

from app.models import (
    DataSourceType,
    ConnectionConfig,
    TableSchema,
    ColumnSchema,
    DatabaseSchema,
    QueryColumn,
)

logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """Abstract base class for all data source connectors."""
    
    def __init__(self, config: ConnectionConfig):
        self.config = config
        self._connection = None
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to the data source."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Close the connection."""
        pass
    
    @abstractmethod
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """
        Test the connection.
        Returns: (success, error_message)
        """
        pass
    
    @abstractmethod
    async def get_schema(self) -> DatabaseSchema:
        """Get the complete schema of the data source."""
        pass
    
    @abstractmethod
    async def execute_query(
        self, query: str, limit: int = 100, timeout: int = 30
    ) -> Tuple[List[QueryColumn], List[List[Any]], int]:
        """
        Execute a query and return results.
        Returns: (columns, rows, execution_time_ms)
        """
        pass
    
    @abstractmethod
    async def get_sample_data(
        self, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> Tuple[List[QueryColumn], List[List[Any]]]:
        """
        Get sample data from a table.
        Returns: (columns, rows)
        """
        pass
    
    async def get_table_count(self, table_name: str) -> int:
        """Get the row count of a table."""
        columns, rows, _ = await self.execute_query(
            f"SELECT COUNT(*) FROM {table_name}", limit=1
        )
        if rows and rows[0]:
            return rows[0][0]
        return 0
    
    async def __aenter__(self):
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()


class SQLConnector(BaseConnector):
    """Base class for SQL-based connectors (PostgreSQL, MySQL, etc.)."""
    
    def _map_sql_type(self, sql_type: str) -> str:
        """Map SQL types to common types."""
        sql_type = sql_type.lower()
        
        if any(t in sql_type for t in ['int', 'serial', 'bigint', 'smallint']):
            return 'integer'
        elif any(t in sql_type for t in ['float', 'double', 'decimal', 'numeric', 'real']):
            return 'number'
        elif any(t in sql_type for t in ['bool']):
            return 'boolean'
        elif any(t in sql_type for t in ['date']):
            return 'date'
        elif any(t in sql_type for t in ['time', 'timestamp']):
            return 'datetime'
        elif any(t in sql_type for t in ['json', 'jsonb']):
            return 'json'
        elif any(t in sql_type for t in ['uuid']):
            return 'uuid'
        elif any(t in sql_type for t in ['array']):
            return 'array'
        else:
            return 'string'
    
    async def get_sample_data(
        self, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> Tuple[List[QueryColumn], List[List[Any]]]:
        """Get sample data using SQL."""
        if random_sample:
            # Most SQL databases support ORDER BY RANDOM() or similar
            query = f"SELECT * FROM {table_name} ORDER BY RANDOM() LIMIT {sample_size}"
        else:
            query = f"SELECT * FROM {table_name} LIMIT {sample_size}"
        
        columns, rows, _ = await self.execute_query(query, limit=sample_size)
        return columns, rows
