import asyncio
import time
from typing import Any, Dict, List, Optional, Tuple
import logging
import aiomysql

from app.models import (
    ConnectionConfig,
    TableSchema,
    ColumnSchema,
    DatabaseSchema,
    QueryColumn,
)
from app.connectors.base import SQLConnector

logger = logging.getLogger(__name__)


class MySQLConnector(SQLConnector):
    """Connector for MySQL databases."""
    
    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self._pool: Optional[aiomysql.Pool] = None
    
    async def connect(self) -> bool:
        """Establish connection pool to MySQL."""
        try:
            self._pool = await aiomysql.create_pool(
                host=self.config.host or "localhost",
                port=self.config.port or 3306,
                user=self.config.username or "root",
                password=self.config.password or "",
                db=self.config.database or "mysql",
                minsize=1,
                maxsize=10,
                autocommit=True,
            )
            logger.info("MySQL connection pool created")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MySQL: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close the connection pool."""
        if self._pool:
            self._pool.close()
            await self._pool.wait_closed()
            self._pool = None
            logger.info("MySQL connection pool closed")
    
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """Test the connection to MySQL."""
        try:
            conn = await aiomysql.connect(
                host=self.config.host or "localhost",
                port=self.config.port or 3306,
                user=self.config.username or "root",
                password=self.config.password or "",
                db=self.config.database or "mysql",
                connect_timeout=10,
            )
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT 1")
            conn.close()
            return True, None
        except aiomysql.Error as e:
            error_code = e.args[0] if e.args else 0
            if error_code == 1045:
                return False, "Invalid username or password"
            elif error_code == 1049:
                return False, f"Database '{self.config.database}' does not exist"
            elif error_code == 2003:
                return False, f"Could not connect to server at {self.config.host}:{self.config.port}"
            return False, str(e)
        except Exception as e:
            return False, str(e)
    
    async def get_schema(self) -> DatabaseSchema:
        """Get the complete schema of the MySQL database."""
        if not self._pool:
            await self.connect()
        
        async with self._pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get all tables
                await cursor.execute("""
                    SELECT 
                        TABLE_NAME as table_name,
                        TABLE_COMMENT as table_comment,
                        TABLE_ROWS as row_count
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = %s
                    AND TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_NAME
                """, (self.config.database,))
                tables = await cursor.fetchall()
                
                # Get all columns
                await cursor.execute("""
                    SELECT 
                        c.TABLE_NAME as table_name,
                        c.COLUMN_NAME as column_name,
                        c.DATA_TYPE as data_type,
                        c.IS_NULLABLE as is_nullable,
                        c.COLUMN_DEFAULT as column_default,
                        c.COLUMN_KEY as column_key,
                        c.COLUMN_COMMENT as column_comment,
                        kcu.REFERENCED_TABLE_NAME as foreign_table,
                        kcu.REFERENCED_COLUMN_NAME as foreign_column
                    FROM information_schema.COLUMNS c
                    LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
                        ON c.TABLE_SCHEMA = kcu.TABLE_SCHEMA
                        AND c.TABLE_NAME = kcu.TABLE_NAME
                        AND c.COLUMN_NAME = kcu.COLUMN_NAME
                        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
                    WHERE c.TABLE_SCHEMA = %s
                    ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
                """, (self.config.database,))
                columns = await cursor.fetchall()
        
        # Build table schemas
        table_columns: Dict[str, List[ColumnSchema]] = {}
        for col in columns:
            table_name = col['table_name']
            if table_name not in table_columns:
                table_columns[table_name] = []
            
            foreign_key = None
            if col['foreign_table'] and col['foreign_column']:
                foreign_key = f"{col['foreign_table']}.{col['foreign_column']}"
            
            table_columns[table_name].append(
                ColumnSchema(
                    name=col['column_name'],
                    type=self._map_sql_type(col['data_type']),
                    nullable=col['is_nullable'] == 'YES',
                    primary_key=col['column_key'] == 'PRI',
                    foreign_key=foreign_key,
                    default=col['column_default'],
                    description=col['column_comment'] if col['column_comment'] else None,
                )
            )
        
        table_schemas = []
        for table in tables:
            table_name = table['table_name']
            table_schemas.append(
                TableSchema(
                    name=table_name,
                    columns=table_columns.get(table_name, []),
                    row_count=table['row_count'],
                    description=table['table_comment'] if table['table_comment'] else None,
                )
            )
        
        return DatabaseSchema(tables=table_schemas)
    
    async def execute_query(
        self, query: str, limit: int = 100, timeout: int = 30
    ) -> Tuple[List[QueryColumn], List[List[Any]], int]:
        """Execute a SQL query on MySQL."""
        if not self._pool:
            await self.connect()
        
        start_time = time.time()
        
        async with self._pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                try:
                    # Add limit if not present
                    query_lower = query.lower().strip()
                    if 'limit' not in query_lower and query_lower.startswith('select'):
                        query = f"{query.rstrip(';')} LIMIT {limit}"
                    
                    # Execute with timeout
                    await asyncio.wait_for(
                        cursor.execute(query),
                        timeout=timeout,
                    )
                    result = await cursor.fetchall()
                    
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
        """Get sample data from MySQL table."""
        if random_sample:
            query = f"SELECT * FROM {table_name} ORDER BY RAND() LIMIT {sample_size}"
        else:
            query = f"SELECT * FROM {table_name} LIMIT {sample_size}"
        
        columns, rows, _ = await self.execute_query(query, limit=sample_size)
        return columns, rows
