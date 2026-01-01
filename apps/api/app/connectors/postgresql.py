import asyncio
import time
from typing import Any, Dict, List, Optional, Tuple
import logging
import asyncpg

from app.models import (
    ConnectionConfig,
    TableSchema,
    ColumnSchema,
    DatabaseSchema,
    QueryColumn,
)
from app.connectors.base import SQLConnector

logger = logging.getLogger(__name__)


class PostgreSQLConnector(SQLConnector):
    """Connector for PostgreSQL databases."""
    
    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self._pool: Optional[asyncpg.Pool] = None
    
    def _build_connection_string(self) -> str:
        """Build the connection string from config."""
        if self.config.connection_string:
            return self.config.connection_string
        
        user = self.config.username or "postgres"
        password = self.config.password or ""
        host = self.config.host or "localhost"
        port = self.config.port or 5432
        database = self.config.database or "postgres"
        
        if password:
            return f"postgresql://{user}:{password}@{host}:{port}/{database}"
        return f"postgresql://{user}@{host}:{port}/{database}"
    
    async def connect(self) -> bool:
        """Establish connection pool to PostgreSQL."""
        try:
            dsn = self._build_connection_string()
            self._pool = await asyncpg.create_pool(
                dsn,
                min_size=1,
                max_size=10,
                ssl=self.config.ssl if self.config.ssl else None,
            )
            logger.info("PostgreSQL connection pool created")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close the connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("PostgreSQL connection pool closed")
    
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """Test the connection to PostgreSQL."""
        try:
            dsn = self._build_connection_string()
            conn = await asyncpg.connect(
                dsn,
                ssl=self.config.ssl if self.config.ssl else None,
                timeout=10,
            )
            await conn.fetchval("SELECT 1")
            await conn.close()
            return True, None
        except asyncpg.InvalidPasswordError:
            return False, "Invalid username or password"
        except asyncpg.InvalidCatalogNameError:
            return False, f"Database '{self.config.database}' does not exist"
        except OSError as e:
            return False, f"Could not connect to server: {str(e)}"
        except Exception as e:
            return False, str(e)
    
    async def get_schema(self) -> DatabaseSchema:
        """Get the complete schema of the PostgreSQL database."""
        if not self._pool:
            await self.connect()
        
        async with self._pool.acquire() as conn:
            # Get all tables
            tables_query = """
                SELECT 
                    t.table_name,
                    obj_description(
                        (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
                    ) as table_comment
                FROM information_schema.tables t
                WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
                ORDER BY t.table_name;
            """
            tables = await conn.fetch(tables_query)
            
            # Get all columns
            columns_query = """
                SELECT 
                    c.table_name,
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.column_default,
                    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
                    fk.foreign_table_name,
                    fk.foreign_column_name,
                    col_description(
                        (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass,
                        c.ordinal_position
                    ) as column_comment
                FROM information_schema.columns c
                LEFT JOIN (
                    SELECT kcu.table_name, kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND tc.table_schema = 'public'
                ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
                LEFT JOIN (
                    SELECT 
                        kcu.table_name,
                        kcu.column_name,
                        ccu.table_name as foreign_table_name,
                        ccu.column_name as foreign_column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage ccu
                        ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public'
                ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
                WHERE c.table_schema = 'public'
                ORDER BY c.table_name, c.ordinal_position;
            """
            columns = await conn.fetch(columns_query)
            
            # Build table schemas
            table_columns: Dict[str, List[ColumnSchema]] = {}
            for col in columns:
                table_name = col['table_name']
                if table_name not in table_columns:
                    table_columns[table_name] = []
                
                foreign_key = None
                if col['foreign_table_name'] and col['foreign_column_name']:
                    foreign_key = f"{col['foreign_table_name']}.{col['foreign_column_name']}"
                
                table_columns[table_name].append(
                    ColumnSchema(
                        name=col['column_name'],
                        type=self._map_sql_type(col['data_type']),
                        nullable=col['is_nullable'] == 'YES',
                        primary_key=col['is_primary_key'],
                        foreign_key=foreign_key,
                        default=col['column_default'],
                        description=col['column_comment'],
                    )
                )
            
            # Get row counts
            table_schemas = []
            for table in tables:
                table_name = table['table_name']
                row_count = await conn.fetchval(
                    f"SELECT COUNT(*) FROM {table_name}"
                )
                table_schemas.append(
                    TableSchema(
                        name=table_name,
                        columns=table_columns.get(table_name, []),
                        row_count=row_count,
                        description=table['table_comment'],
                    )
                )
            
            return DatabaseSchema(tables=table_schemas)
    
    async def execute_query(
        self, query: str, limit: int = 100, timeout: int = 30
    ) -> Tuple[List[QueryColumn], List[List[Any]], int]:
        """Execute a SQL query on PostgreSQL."""
        if not self._pool:
            await self.connect()
        
        start_time = time.time()
        
        async with self._pool.acquire() as conn:
            try:
                # Add limit if not present
                query_lower = query.lower().strip()
                if 'limit' not in query_lower and query_lower.startswith('select'):
                    query = f"{query.rstrip(';')} LIMIT {limit}"
                
                # Execute with timeout
                result = await asyncio.wait_for(
                    conn.fetch(query),
                    timeout=timeout,
                )
                
                execution_time_ms = int((time.time() - start_time) * 1000)
                
                if not result:
                    return [], [], execution_time_ms
                
                # Extract columns from first row
                columns = [
                    QueryColumn(name=key, type=self._map_sql_type(str(type(value).__name__)))
                    for key, value in result[0].items()
                ]
                
                # Convert rows to lists
                rows = [[value for value in record.values()] for record in result]
                
                return columns, rows, execution_time_ms
                
            except asyncio.TimeoutError:
                raise TimeoutError(f"Query timed out after {timeout} seconds")
            except Exception as e:
                logger.error(f"Query execution failed: {e}")
                raise
    
    async def get_sample_data(
        self, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> Tuple[List[QueryColumn], List[List[Any]]]:
        """Get sample data using TABLESAMPLE for efficiency."""
        if random_sample:
            # Use TABLESAMPLE for large tables (PostgreSQL specific)
            query = f"""
                SELECT * FROM {table_name} 
                TABLESAMPLE BERNOULLI(10) 
                LIMIT {sample_size}
            """
        else:
            query = f"SELECT * FROM {table_name} LIMIT {sample_size}"
        
        try:
            columns, rows, _ = await self.execute_query(query, limit=sample_size)
            return columns, rows
        except Exception:
            # Fallback to regular sample if TABLESAMPLE fails
            return await super().get_sample_data(table_name, sample_size, random_sample)
