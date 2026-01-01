from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DataSourceType(str, Enum):
    """Supported data source types."""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    SQLITE = "sqlite"
    SNOWFLAKE = "snowflake"
    BIGQUERY = "bigquery"
    REDSHIFT = "redshift"
    CSV = "csv"
    REST_API = "rest_api"
    EXCEL = "excel"
    JSON = "json"


class ConnectionStatus(str, Enum):
    """Connection status for data sources."""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    SYNCING = "syncing"


class IntegrationType(str, Enum):
    """Supported integration types."""
    SLACK = "slack"
    TEAMS = "teams"


class InsightType(str, Enum):
    """Types of AI-generated insights."""
    TREND = "trend"
    ANOMALY = "anomaly"
    CORRELATION = "correlation"
    RECOMMENDATION = "recommendation"
    SUMMARY = "summary"


class InsightSeverity(str, Enum):
    """Severity levels for insights."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Data Source Models
class ColumnSchema(BaseModel):
    """Schema for a database column."""
    name: str
    type: str
    nullable: bool = True
    primary_key: bool = False
    foreign_key: Optional[str] = None
    default: Optional[str] = None
    description: Optional[str] = None


class TableSchema(BaseModel):
    """Schema for a database table."""
    name: str
    columns: List[ColumnSchema]
    row_count: Optional[int] = None
    description: Optional[str] = None


class DatabaseSchema(BaseModel):
    """Complete database schema."""
    tables: List[TableSchema]
    relationships: Optional[List[Dict[str, Any]]] = None


class ConnectionConfig(BaseModel):
    """Connection configuration for a data source."""
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl: bool = False
    connection_string: Optional[str] = None
    
    # For file-based sources
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    
    # For REST API sources
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    
    # Cloud-specific settings
    account: Optional[str] = None  # Snowflake
    warehouse: Optional[str] = None  # Snowflake
    project_id: Optional[str] = None  # BigQuery
    dataset: Optional[str] = None  # BigQuery
    credentials_json: Optional[str] = None  # BigQuery


class DataSourceBase(BaseModel):
    """Base model for data sources."""
    name: str = Field(..., min_length=1, max_length=100)
    type: DataSourceType
    description: Optional[str] = None
    config: ConnectionConfig


class DataSourceCreate(DataSourceBase):
    """Model for creating a new data source."""
    pass


class DataSourceUpdate(BaseModel):
    """Model for updating a data source."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    config: Optional[ConnectionConfig] = None


class DataSourceResponse(DataSourceBase):
    """Response model for data sources."""
    id: str
    status: ConnectionStatus
    schema_data: Optional[DatabaseSchema] = None
    last_synced: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Query Models
class QueryRequest(BaseModel):
    """Request model for executing queries."""
    query: str
    limit: int = Field(default=100, ge=1, le=10000)
    timeout: int = Field(default=30, ge=1, le=300)


class NLQueryRequest(BaseModel):
    """Request model for natural language queries."""
    question: str
    include_explanation: bool = True


class QueryColumn(BaseModel):
    """Column metadata in query results."""
    name: str
    type: str


class QueryResult(BaseModel):
    """Response model for query results."""
    columns: List[QueryColumn]
    rows: List[List[Any]]
    row_count: int
    execution_time_ms: int
    query: str
    generated_sql: Optional[str] = None
    explanation: Optional[str] = None


# Chat Models
class ChatMessage(BaseModel):
    """A chat message."""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data_source_id: Optional[str] = None
    sql_query: Optional[str] = None
    results: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Request model for chat."""
    message: str
    data_source_id: Optional[str] = None
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat."""
    message: str
    conversation_id: str
    sql_query: Optional[str] = None
    results: Optional[QueryResult] = None
    suggestions: Optional[List[str]] = None


# Insight Models
class InsightMetric(BaseModel):
    """A metric within an insight."""
    name: str
    value: Any
    change: Optional[float] = None
    unit: Optional[str] = None


class InsightBase(BaseModel):
    """Base model for insights."""
    title: str
    description: str
    type: InsightType
    severity: InsightSeverity
    confidence: float = Field(ge=0, le=1)
    metrics: Optional[List[InsightMetric]] = None
    data_source_id: str
    sql_query: Optional[str] = None


class InsightCreate(InsightBase):
    """Model for creating an insight."""
    pass


class InsightResponse(InsightBase):
    """Response model for insights."""
    id: str
    created_at: datetime
    acknowledged: bool = False
    
    class Config:
        from_attributes = True


class GenerateInsightsRequest(BaseModel):
    """Request to generate insights for a data source."""
    data_source_id: str
    focus_areas: Optional[List[str]] = None
    max_insights: int = Field(default=5, ge=1, le=20)


# Integration Models
class IntegrationBase(BaseModel):
    """Base model for integrations."""
    type: IntegrationType
    name: str
    enabled: bool = True


class SlackConfig(BaseModel):
    """Slack-specific configuration."""
    bot_token: str
    channel_ids: Optional[List[str]] = None
    notify_on_insights: bool = True
    notify_on_anomalies: bool = True


class TeamsConfig(BaseModel):
    """Teams-specific configuration."""
    webhook_url: str
    notify_on_insights: bool = True
    notify_on_anomalies: bool = True


class IntegrationCreate(IntegrationBase):
    """Model for creating an integration."""
    slack_config: Optional[SlackConfig] = None
    teams_config: Optional[TeamsConfig] = None


class IntegrationResponse(IntegrationBase):
    """Response model for integrations."""
    id: str
    status: ConnectionStatus
    last_message_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Sample Data Models
class SampleDataRequest(BaseModel):
    """Request for sampling data from a source."""
    data_source_id: str
    table_name: str
    sample_size: int = Field(default=100, ge=1, le=10000)
    random_sample: bool = True


class SampleDataResponse(BaseModel):
    """Response with sampled data."""
    data_source_id: str
    table_name: str
    sample_size: int
    columns: List[QueryColumn]
    rows: List[List[Any]]
    statistics: Optional[Dict[str, Any]] = None


# Health Check
class HealthCheck(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
