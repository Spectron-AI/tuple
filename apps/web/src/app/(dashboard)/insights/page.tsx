"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Filter,
  Download,
  Share2,
  BarChart3,
  LineChart,
  PieChart,
  Database,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  dataSource: string;
  confidence: number;
  createdAt: string;
  visualization: string;
  metrics: Array<{ label?: string; name?: string; value: any; change?: any; unit?: string }>;
}

interface DataSourceItem {
  id: string;
  name: string;
  type: string;
}

const insightTypes = [
  { id: "all", label: "All Insights" },
  { id: "trend", label: "Trends" },
  { id: "anomaly", label: "Anomalies" },
  { id: "correlation", label: "Correlations" },
  { id: "recommendation", label: "Recommendations" },
];

export default function InsightsPage() {
  const [selectedType, setSelectedType] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDataSources();
    setIsLoading(false);
  }, []);

  const loadDataSources = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/datasources");
      if (res.ok) {
        const data = await res.json();
        setDataSources(data);
      }
    } catch (error) {
      console.error("Failed to load data sources:", error);
    }
  };

  const filteredInsights =
    selectedType === "all"
      ? insights
      : insights.filter((insight: Insight) => insight.type === selectedType);

  const handleGenerateInsights = async () => {
    if (dataSources.length === 0) {
      toast.error("Please connect a data source first");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call the insights generate API
      const targetSource = selectedDataSource === "all" 
        ? dataSources[0]?.id 
        : selectedDataSource;
      
      const res = await fetch("http://localhost:8000/api/v1/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data_source_id: targetSource,
          max_insights: 5,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Transform API response to match our Insight interface
        const transformedInsights = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.insight_type || item.type || "trend",
          severity: item.severity || "info",
          dataSource: dataSources.find(ds => ds.id === item.data_source_id)?.name || "Unknown",
          confidence: item.confidence || 85,
          createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : "Just now",
          visualization: item.visualization || "bar",
          metrics: item.metrics || [],
        }));
        setInsights(transformedInsights);
        toast.success(`Generated ${transformedInsights.length} insights!`);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.detail || "Failed to generate insights");
      }
    } catch (err) {
      console.error("Error generating insights:", err);
      toast.error("Failed to connect to API");
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-5 w-5" />;
      case "anomaly":
        return <AlertTriangle className="h-5 w-5" />;
      case "recommendation":
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case "line":
        return <LineChart className="h-5 w-5" />;
      case "bar":
        return <BarChart3 className="h-5 w-5" />;
      case "pie":
        return <PieChart className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            AI-powered discoveries and recommendations from your data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="gap-2"
            onClick={handleGenerateInsights}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by:</span>
        </div>
        <div className="flex gap-2">
          {insightTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.id)}
            >
              {type.label}
            </Button>
          ))}
        </div>
        <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
          <SelectTrigger className="w-48 ml-auto">
            <Database className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Data Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Data Sources</SelectItem>
            {dataSources.map((ds) => (
              <SelectItem key={ds.id} value={ds.id}>
                {ds.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Insights Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
          <h3 className="mt-4 text-lg font-semibold">Loading...</h3>
        </div>
      ) : filteredInsights.length === 0 ? (
        <Card className="py-16">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No AI Insights Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {dataSources.length === 0 
                ? "Connect a data source first, then generate AI-powered insights about your data."
                : "Click 'Generate Insights' to analyze your connected data sources and discover patterns, anomalies, and recommendations."}
            </p>
            <div className="flex items-center justify-center gap-4">
              {dataSources.length === 0 ? (
                <Button asChild>
                  <a href="/datasources">
                    <Database className="h-4 w-4 mr-2" />
                    Connect Data Source
                  </a>
                </Button>
              ) : (
                <Button onClick={handleGenerateInsights} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Insights
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {filteredInsights.map((insight: Insight, index: number) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        insight.severity === "critical"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : insight.severity === "warning"
                          ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {getTypeIcon(insight.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {insight.dataSource} • {insight.createdAt}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(insight.severity) as any}>
                      {insight.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {insight.metrics.map((metric, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{metric.label || metric.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold">{metric.value}</span>
                        {metric.change !== undefined && metric.change !== null && (
                          <Badge
                            variant={
                              String(metric.change).startsWith("+") || Number(metric.change) > 0 
                                ? "success" 
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {typeof metric.change === "number" 
                              ? (metric.change > 0 ? `+${metric.change}` : metric.change)
                              : metric.change}
                            {metric.unit || ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Confidence Score */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {getVisualizationIcon(insight.visualization)}
                    <span className="text-sm text-muted-foreground">
                      Confidence: {insight.confidence}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </motion.div>
      )}
    </div>
  );
}
