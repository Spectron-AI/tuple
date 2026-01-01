import axios from "axios";
import { DataSource, ConnectionConfig, DataSourceType, QueryResult, Insight, ApiResponse } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Data Source API
export const dataSourceApi = {
  // Get all data sources
  getAll: async (): Promise<ApiResponse<DataSource[]>> => {
    const response = await api.get("/datasources");
    return response.data;
  },

  // Get single data source
  getById: async (id: string): Promise<ApiResponse<DataSource>> => {
    const response = await api.get(`/datasources/${id}`);
    return response.data;
  },

  // Create new data source
  create: async (data: {
    name: string;
    type: DataSourceType;
    config: ConnectionConfig;
  }): Promise<ApiResponse<DataSource>> => {
    const response = await api.post("/datasources", data);
    return response.data;
  },

  // Update data source
  update: async (id: string, data: Partial<DataSource>): Promise<ApiResponse<DataSource>> => {
    const response = await api.put(`/datasources/${id}`, data);
    return response.data;
  },

  // Delete data source
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/datasources/${id}`);
    return response.data;
  },

  // Test connection
  testConnection: async (data: {
    type: DataSourceType;
    config: ConnectionConfig;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.post("/datasources/test", data);
    return response.data;
  },

  // Sync schema
  syncSchema: async (id: string): Promise<ApiResponse<DataSource>> => {
    const response = await api.post(`/datasources/${id}/sync`);
    return response.data;
  },

  // Get sample data
  getSampleData: async (id: string, table: string, limit?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/datasources/${id}/tables/${table}/sample`, {
      params: { limit },
    });
    return response.data;
  },
};

// Query API
export const queryApi = {
  // Execute query
  execute: async (data: {
    dataSourceId: string;
    query: string;
  }): Promise<ApiResponse<QueryResult>> => {
    const response = await api.post("/query/execute", data);
    return response.data;
  },

  // Natural language to SQL
  nlToSql: async (data: {
    dataSourceId: string;
    question: string;
  }): Promise<ApiResponse<{ sql: string; explanation: string }>> => {
    const response = await api.post("/query/nl-to-sql", data);
    return response.data;
  },

  // Get query history
  getHistory: async (dataSourceId?: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/query/history", {
      params: { dataSourceId },
    });
    return response.data;
  },
};

// Insights API
export const insightsApi = {
  // Generate insights for a data source
  generate: async (dataSourceId: string): Promise<ApiResponse<Insight[]>> => {
    const response = await api.post(`/insights/generate`, { dataSourceId });
    return response.data;
  },

  // Get all insights
  getAll: async (dataSourceId?: string): Promise<ApiResponse<Insight[]>> => {
    const response = await api.get("/insights", {
      params: { dataSourceId },
    });
    return response.data;
  },

  // Get insight by ID
  getById: async (id: string): Promise<ApiResponse<Insight>> => {
    const response = await api.get(`/insights/${id}`);
    return response.data;
  },

  // Delete insight
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/insights/${id}`);
    return response.data;
  },
};

// Chat API
export const chatApi = {
  // Send message
  sendMessage: async (data: {
    dataSourceId: string;
    message: string;
    conversationId?: string;
  }): Promise<ApiResponse<{
    response: string;
    query?: string;
    results?: QueryResult;
    suggestions?: string[];
  }>> => {
    const response = await api.post("/chat/message", data);
    return response.data;
  },

  // Get conversation history
  getConversation: async (conversationId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Get all conversations
  getConversations: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/chat/conversations");
    return response.data;
  },
};

// Integration API
export const integrationApi = {
  // Get all integrations
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/integrations");
    return response.data;
  },

  // Setup Slack integration
  setupSlack: async (data: {
    botToken: string;
    channelId?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("/integrations/slack", data);
    return response.data;
  },

  // Setup Teams integration
  setupTeams: async (data: {
    webhookUrl: string;
    teamId?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("/integrations/teams", data);
    return response.data;
  },

  // Delete integration
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/integrations/${id}`);
    return response.data;
  },

  // Test integration
  test: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.post(`/integrations/${id}/test`);
    return response.data;
  },
};

export default api;
