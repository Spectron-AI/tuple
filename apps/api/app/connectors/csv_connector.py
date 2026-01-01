import time
import io
from typing import Any, List, Optional, Tuple
import logging

import pandas as pd
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


class CSVConnector(BaseConnector):
    """Connector for CSV files."""
    
    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self._dataframe: Optional[pd.DataFrame] = None
    
    async def connect(self) -> bool:
        """Load the CSV file into memory."""
        try:
            if self.config.file_path:
                self._dataframe = pd.read_csv(self.config.file_path)
            elif self.config.file_url:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.config.file_url)
                    response.raise_for_status()
                    self._dataframe = pd.read_csv(io.StringIO(response.text))
            else:
                raise ValueError("Either file_path or file_url must be provided")
            
            logger.info(f"CSV loaded with {len(self._dataframe)} rows")
            return True
        except Exception as e:
            logger.error(f"Failed to load CSV: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Clear the dataframe from memory."""
        self._dataframe = None
        logger.info("CSV connection closed")
    
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """Test the CSV connection by trying to load the file."""
        try:
            if self.config.file_path:
                pd.read_csv(self.config.file_path, nrows=1)
            elif self.config.file_url:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.config.file_url, timeout=10)
                    response.raise_for_status()
                    pd.read_csv(io.StringIO(response.text), nrows=1)
            else:
                return False, "Either file_path or file_url must be provided"
            return True, None
        except FileNotFoundError:
            return False, f"File not found: {self.config.file_path}"
        except httpx.HTTPError as e:
            return False, f"HTTP error: {str(e)}"
        except pd.errors.EmptyDataError:
            return False, "CSV file is empty"
        except pd.errors.ParserError as e:
            return False, f"CSV parsing error: {str(e)}"
        except Exception as e:
            return False, str(e)
    
    def _pandas_type_to_string(self, dtype: str) -> str:
        """Convert pandas dtype to a string type."""
        dtype_str = str(dtype).lower()
        if 'int' in dtype_str:
            return 'integer'
        elif 'float' in dtype_str:
            return 'number'
        elif 'bool' in dtype_str:
            return 'boolean'
        elif 'datetime' in dtype_str:
            return 'datetime'
        elif 'date' in dtype_str:
            return 'date'
        else:
            return 'string'
    
    async def get_schema(self) -> DatabaseSchema:
        """Get the schema of the CSV file."""
        if self._dataframe is None:
            await self.connect()
        
        columns = []
        for col_name in self._dataframe.columns:
            columns.append(
                ColumnSchema(
                    name=str(col_name),
                    type=self._pandas_type_to_string(self._dataframe[col_name].dtype),
                    nullable=self._dataframe[col_name].isna().any(),
                    primary_key=False,
                )
            )
        
        # CSV is treated as a single table named 'data'
        table_schema = TableSchema(
            name="data",
            columns=columns,
            row_count=len(self._dataframe),
        )
        
        return DatabaseSchema(tables=[table_schema])
    
    async def execute_query(
        self, query: str, limit: int = 100, timeout: int = 30
    ) -> Tuple[List[QueryColumn], List[List[Any]], int]:
        """
        Execute a query on the CSV data using pandas query syntax.
        Supports pandas query() syntax or column selections.
        """
        if self._dataframe is None:
            await self.connect()
        
        start_time = time.time()
        
        try:
            # Try to parse as a pandas query
            if query.strip().lower() == 'select *':
                result_df = self._dataframe.head(limit)
            elif query.strip().startswith('SELECT') or query.strip().startswith('select'):
                # Simple SQL-like SELECT parsing
                result_df = self._simple_sql_parse(query, limit)
            else:
                # Use pandas query syntax
                result_df = self._dataframe.query(query).head(limit)
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            columns = [
                QueryColumn(name=str(col), type=self._pandas_type_to_string(result_df[col].dtype))
                for col in result_df.columns
            ]
            
            rows = result_df.values.tolist()
            
            return columns, rows, execution_time_ms
            
        except Exception as e:
            logger.error(f"CSV query failed: {e}")
            raise
    
    def _simple_sql_parse(self, query: str, limit: int) -> pd.DataFrame:
        """Parse simple SQL-like queries for CSV data."""
        query = query.strip()
        
        # Remove SELECT keyword
        if query.upper().startswith('SELECT'):
            query = query[6:].strip()
        
        # Handle SELECT *
        if query.startswith('*'):
            query = query[1:].strip()
            if query.upper().startswith('FROM'):
                query = query[4:].strip()
                # Remove table name
                parts = query.split()
                if parts:
                    query = ' '.join(parts[1:]) if len(parts) > 1 else ''
            
            if query.upper().startswith('WHERE'):
                where_clause = query[5:].strip()
                # Handle LIMIT in WHERE
                if 'LIMIT' in where_clause.upper():
                    limit_idx = where_clause.upper().index('LIMIT')
                    limit_str = where_clause[limit_idx + 5:].strip().split()[0]
                    limit = int(limit_str)
                    where_clause = where_clause[:limit_idx].strip()
                
                if where_clause:
                    return self._dataframe.query(where_clause).head(limit)
            
            return self._dataframe.head(limit)
        
        # Handle specific columns
        columns_part = query
        where_clause = None
        
        if 'FROM' in query.upper():
            from_idx = query.upper().index('FROM')
            columns_part = query[:from_idx].strip()
            rest = query[from_idx + 4:].strip()
            
            if 'WHERE' in rest.upper():
                where_idx = rest.upper().index('WHERE')
                where_clause = rest[where_idx + 5:].strip()
        
        # Parse columns
        columns = [c.strip() for c in columns_part.split(',')]
        
        df = self._dataframe[columns] if columns != ['*'] else self._dataframe
        
        if where_clause:
            if 'LIMIT' in where_clause.upper():
                limit_idx = where_clause.upper().index('LIMIT')
                limit = int(where_clause[limit_idx + 5:].strip().split()[0])
                where_clause = where_clause[:limit_idx].strip()
            if where_clause:
                df = df.query(where_clause)
        
        return df.head(limit)
    
    async def get_sample_data(
        self, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> Tuple[List[QueryColumn], List[List[Any]]]:
        """Get sample data from the CSV."""
        if self._dataframe is None:
            await self.connect()
        
        if random_sample:
            sample_size = min(sample_size, len(self._dataframe))
            sample_df = self._dataframe.sample(n=sample_size)
        else:
            sample_df = self._dataframe.head(sample_size)
        
        columns = [
            QueryColumn(name=str(col), type=self._pandas_type_to_string(sample_df[col].dtype))
            for col in sample_df.columns
        ]
        
        rows = sample_df.values.tolist()
        
        return columns, rows
