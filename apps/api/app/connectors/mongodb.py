import time
from typing import Any, Dict, List, Optional, Tuple
import logging
from motor.motor_asyncio import AsyncIOMotorClient

from app.models import (
    ConnectionConfig,
    TableSchema,
    ColumnSchema,
    DatabaseSchema,
    QueryColumn,
)
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class MongoDBConnector(BaseConnector):
    """Connector for MongoDB databases."""
    
    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self._client: Optional[AsyncIOMotorClient] = None
        self._db = None
    
    def _build_connection_string(self) -> str:
        """Build the MongoDB connection string from config."""
        if self.config.connection_string:
            return self.config.connection_string
        
        user = self.config.username
        password = self.config.password
        host = self.config.host or "localhost"
        port = self.config.port or 27017
        database = self.config.database or "test"
        
        if user and password:
            return f"mongodb://{user}:{password}@{host}:{port}/{database}"
        return f"mongodb://{host}:{port}/{database}"
    
    async def connect(self) -> bool:
        """Establish connection to MongoDB."""
        try:
            connection_string = self._build_connection_string()
            self._client = AsyncIOMotorClient(connection_string)
            self._db = self._client[self.config.database or "test"]
            
            # Verify connection
            await self._client.admin.command('ping')
            logger.info("MongoDB connection established")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close the MongoDB connection."""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("MongoDB connection closed")
    
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """Test the connection to MongoDB."""
        try:
            connection_string = self._build_connection_string()
            client = AsyncIOMotorClient(connection_string, serverSelectionTimeoutMS=5000)
            await client.admin.command('ping')
            client.close()
            return True, None
        except Exception as e:
            error_str = str(e)
            if "Authentication failed" in error_str:
                return False, "Invalid username or password"
            elif "ServerSelectionTimeoutError" in error_str:
                return False, f"Could not connect to server at {self.config.host}:{self.config.port}"
            return False, error_str
    
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
        """Get the schema of the MongoDB database by sampling documents."""
        if not self._db:
            await self.connect()
        
        # Get all collections
        collection_names = await self._db.list_collection_names()
        
        table_schemas = []
        for collection_name in collection_names:
            if collection_name.startswith('system.'):
                continue
            
            collection = self._db[collection_name]
            
            # Get document count
            row_count = await collection.count_documents({})
            
            # Sample documents to infer schema
            sample_docs = await collection.aggregate([
                {"$sample": {"size": min(100, row_count) if row_count > 0 else 1}}
            ]).to_list(100)
            
            # Infer columns from sampled documents
            field_types: Dict[str, set] = {}
            for doc in sample_docs:
                for key, value in doc.items():
                    if key not in field_types:
                        field_types[key] = set()
                    field_types[key].add(self._infer_type_from_value(value))
            
            columns = []
            for field_name, types in field_types.items():
                # Use the most common type, or 'mixed' if multiple
                if len(types) == 1:
                    field_type = types.pop()
                else:
                    field_type = "mixed"
                
                columns.append(
                    ColumnSchema(
                        name=field_name,
                        type=field_type,
                        nullable=True,  # MongoDB fields are always nullable
                        primary_key=field_name == "_id",
                    )
                )
            
            table_schemas.append(
                TableSchema(
                    name=collection_name,
                    columns=columns,
                    row_count=row_count,
                )
            )
        
        return DatabaseSchema(tables=table_schemas)
    
    async def execute_query(
        self, query: str, limit: int = 100, timeout: int = 30
    ) -> Tuple[List[QueryColumn], List[List[Any]], int]:
        """
        Execute a MongoDB query.
        Query format: collection_name:json_query or collection_name:aggregation_pipeline
        """
        if not self._db:
            await self.connect()
        
        start_time = time.time()
        
        try:
            # Parse query format: collection_name:query_json
            if ':' not in query:
                raise ValueError("Query format should be: collection_name:{query_json}")
            
            collection_name, query_json = query.split(':', 1)
            collection_name = collection_name.strip()
            query_json = query_json.strip()
            
            collection = self._db[collection_name]
            
            # Parse query JSON
            import json
            query_dict = json.loads(query_json) if query_json else {}
            
            # Check if it's an aggregation pipeline
            if isinstance(query_dict, list):
                # Aggregation pipeline
                cursor = collection.aggregate(query_dict)
            else:
                # Regular find query
                cursor = collection.find(query_dict).limit(limit)
            
            docs = await cursor.to_list(limit)
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            if not docs:
                return [], [], execution_time_ms
            
            # Extract columns from first document
            columns = [
                QueryColumn(name=key, type=self._infer_type_from_value(value))
                for key, value in docs[0].items()
            ]
            
            # Convert documents to rows
            rows = []
            for doc in docs:
                row = []
                for col in columns:
                    value = doc.get(col.name)
                    # Convert ObjectId to string
                    if hasattr(value, '__str__') and type(value).__name__ == 'ObjectId':
                        value = str(value)
                    row.append(value)
                rows.append(row)
            
            return columns, rows, execution_time_ms
            
        except Exception as e:
            logger.error(f"MongoDB query failed: {e}")
            raise
    
    async def get_sample_data(
        self, table_name: str, sample_size: int = 100, random_sample: bool = True
    ) -> Tuple[List[QueryColumn], List[List[Any]]]:
        """Get sample data from a MongoDB collection."""
        if not self._db:
            await self.connect()
        
        collection = self._db[table_name]
        
        if random_sample:
            cursor = collection.aggregate([
                {"$sample": {"size": sample_size}}
            ])
        else:
            cursor = collection.find({}).limit(sample_size)
        
        docs = await cursor.to_list(sample_size)
        
        if not docs:
            return [], []
        
        # Extract columns from first document
        columns = [
            QueryColumn(name=key, type=self._infer_type_from_value(value))
            for key, value in docs[0].items()
        ]
        
        # Convert documents to rows
        rows = []
        for doc in docs:
            row = []
            for col in columns:
                value = doc.get(col.name)
                if hasattr(value, '__str__') and type(value).__name__ == 'ObjectId':
                    value = str(value)
                row.append(value)
            rows.append(row)
        
        return columns, rows
