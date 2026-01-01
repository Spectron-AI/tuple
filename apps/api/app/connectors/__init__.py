# Connectors module
from typing import Type
from app.models import DataSourceType, ConnectionConfig
from app.connectors.base import BaseConnector


def get_connector(data_source_type: DataSourceType, config: ConnectionConfig) -> BaseConnector:
    """Factory function to get the appropriate connector for a data source type."""
    
    connector_map: dict[DataSourceType, Type[BaseConnector]] = {}
    
    # Import connectors lazily to avoid import errors if dependencies are missing
    if data_source_type == DataSourceType.POSTGRESQL:
        from app.connectors.postgresql import PostgreSQLConnector
        return PostgreSQLConnector(config)
    
    elif data_source_type == DataSourceType.MYSQL:
        from app.connectors.mysql import MySQLConnector
        return MySQLConnector(config)
    
    elif data_source_type == DataSourceType.MONGODB:
        from app.connectors.mongodb import MongoDBConnector
        return MongoDBConnector(config)
    
    elif data_source_type == DataSourceType.CSV:
        from app.connectors.csv_connector import CSVConnector
        return CSVConnector(config)
    
    elif data_source_type == DataSourceType.REST_API:
        from app.connectors.rest_api import RESTAPIConnector
        return RESTAPIConnector(config)
    
    elif data_source_type == DataSourceType.SQLITE:
        # SQLite uses the same connector approach as PostgreSQL
        from app.connectors.postgresql import PostgreSQLConnector
        # Modify config for SQLite
        config.connection_string = f"sqlite:///{config.database}"
        return PostgreSQLConnector(config)
    
    else:
        raise ValueError(f"Unsupported data source type: {data_source_type}")


__all__ = [
    "BaseConnector",
    "get_connector",
]
