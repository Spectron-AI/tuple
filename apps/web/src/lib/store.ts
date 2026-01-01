import { create } from "zustand";
import { DataSource, DataSourceType, ConnectionConfig } from "@/types";

interface DataSourceState {
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  addDataSource: (dataSource: DataSource) => void;
  removeDataSource: (id: string) => void;
  selectDataSource: (id: string | null) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  dataSources: [],
  selectedDataSource: null,
  isConnecting: false,
  error: null,

  addDataSource: (dataSource) =>
    set((state) => ({
      dataSources: [...state.dataSources, dataSource],
    })),

  removeDataSource: (id) =>
    set((state) => ({
      dataSources: state.dataSources.filter((ds) => ds.id !== id),
      selectedDataSource:
        state.selectedDataSource?.id === id ? null : state.selectedDataSource,
    })),

  selectDataSource: (id) =>
    set((state) => ({
      selectedDataSource: id
        ? state.dataSources.find((ds) => ds.id === id) || null
        : null,
    })),

  updateDataSource: (id, updates) =>
    set((state) => ({
      dataSources: state.dataSources.map((ds) =>
        ds.id === id ? { ...ds, ...updates } : ds
      ),
      selectedDataSource:
        state.selectedDataSource?.id === id
          ? { ...state.selectedDataSource, ...updates }
          : state.selectedDataSource,
    })),

  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
}));

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentConversationId: string | null;

  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (isLoading: boolean) => void;
  clearMessages: () => void;
  setConversationId: (id: string | null) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    query?: string;
    results?: any;
    visualization?: string;
  };
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  currentConversationId: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
  setConversationId: (id) => set({ currentConversationId: id }),
}));

interface InsightState {
  insights: Insight[];
  isGenerating: boolean;
  
  addInsight: (insight: Insight) => void;
  setInsights: (insights: Insight[]) => void;
  setGenerating: (isGenerating: boolean) => void;
  removeInsight: (id: string) => void;
}

interface Insight {
  id: string;
  dataSourceId: string;
  title: string;
  description: string;
  type: "trend" | "anomaly" | "correlation" | "summary";
  data: any;
  createdAt: Date;
}

export const useInsightStore = create<InsightState>((set) => ({
  insights: [],
  isGenerating: false,

  addInsight: (insight) =>
    set((state) => ({
      insights: [...state.insights, insight],
    })),

  setInsights: (insights) => set({ insights }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  
  removeInsight: (id) =>
    set((state) => ({
      insights: state.insights.filter((i) => i.id !== id),
    })),
}));
