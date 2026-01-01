export type DataSourceType = 
  | "postgresql"
  | "mysql"
  | "mongodb"
  | "sqlite"
  | "csv"
  | "excel"
  | "rest_api"
  | "graphql"
  | "snowflake"
  | "bigquery"
  | "redshift";

export interface ConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  url?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  filePath?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: ConnectionConfig;
  status: "connected" | "disconnected" | "error";
  lastConnected?: Date;
  schema?: DatabaseSchema;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  relationships?: Relationship[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  rowCount?: number;
  sampleData?: Record<string, any>[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  description?: string;
  statistics?: ColumnStatistics;
}

export interface ColumnStatistics {
  distinctCount?: number;
  nullCount?: number;
  minValue?: any;
  maxValue?: any;
  avgValue?: number;
  topValues?: { value: any; count: number }[];
}

export interface Relationship {
  from: { table: string; column: string };
  to: { table: string; column: string };
  type: "one-to-one" | "one-to-many" | "many-to-many";
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
  error?: string;
}

export interface Insight {
  id: string;
  dataSourceId: string;
  title: string;
  description: string;
  type: "trend" | "anomaly" | "correlation" | "summary" | "recommendation";
  severity?: "info" | "warning" | "critical";
  data: any;
  visualization?: VisualizationConfig;
  createdAt: Date;
}

export interface VisualizationConfig {
  type: "bar" | "line" | "pie" | "scatter" | "table" | "metric";
  config: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    query?: string;
    results?: QueryResult;
    visualization?: VisualizationConfig;
    suggestions?: string[];
  };
}

export interface Integration {
  id: string;
  type: "slack" | "teams";
  name: string;
  status: "active" | "inactive" | "error";
  config: IntegrationConfig;
  createdAt: Date;
}

export interface IntegrationConfig {
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
  teamId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "editor" | "viewer";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
