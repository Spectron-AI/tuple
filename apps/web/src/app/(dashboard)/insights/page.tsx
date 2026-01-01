"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const mockInsights = [
  {
    id: "1",
    title: "Revenue Growth Trend",
    description:
      "Your monthly revenue has been growing steadily at an average rate of 15% over the past 6 months. This exceeds the industry benchmark of 8%.",
    type: "trend",
    severity: "info",
    dataSource: "Production PostgreSQL",
    confidence: 92,
    createdAt: "2 hours ago",
    visualization: "line",
    metrics: [
      { label: "Growth Rate", value: "15%", change: "+3%" },
      { label: "Industry Avg", value: "8%", change: "" },
    ],
  },
  {
    id: "2",
    title: "Unusual Order Spike Detected",
    description:
      "Orders from the APAC region increased by 340% yesterday compared to the 30-day average. This anomaly may indicate a successful marketing campaign or potential data quality issue.",
    type: "anomaly",
    severity: "warning",
    dataSource: "Analytics MongoDB",
    confidence: 87,
    createdAt: "5 hours ago",
    visualization: "bar",
    metrics: [
      { label: "APAC Orders", value: "2,450", change: "+340%" },
      { label: "30-day Avg", value: "560", change: "" },
    ],
  },
  {
    id: "3",
    title: "Customer Churn Risk",
    description:
      "23 enterprise customers show high churn risk based on decreased engagement, support ticket frequency, and usage patterns. Immediate attention recommended.",
    type: "recommendation",
    severity: "critical",
    dataSource: "Sales Data API",
    confidence: 78,
    createdAt: "1 day ago",
    visualization: "pie",
    metrics: [
      { label: "At-Risk Customers", value: "23", change: "+5" },
      { label: "Potential Revenue Loss", value: "$450K", change: "" },
    ],
  },
  {
    id: "4",
    title: "Product Performance Correlation",
    description:
      "Strong positive correlation (0.85) found between customer support response time and product reviews. Faster response times correlate with 2.3x higher ratings.",
    type: "correlation",
    severity: "info",
    dataSource: "Production PostgreSQL",
    confidence: 94,
    createdAt: "2 days ago",
    visualization: "scatter",
    metrics: [
      { label: "Correlation", value: "0.85", change: "" },
      { label: "Rating Impact", value: "2.3x", change: "" },
    ],
  },
];

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

  const filteredInsights =
    selectedType === "all"
      ? mockInsights
      : mockInsights.filter((insight) => insight.type === selectedType);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsGenerating(false);
    toast.success("New insights generated!");
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
        <Select>
          <SelectTrigger className="w-48 ml-auto">
            <SelectValue placeholder="All Data Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Data Sources</SelectItem>
            <SelectItem value="postgresql">Production PostgreSQL</SelectItem>
            <SelectItem value="mongodb">Analytics MongoDB</SelectItem>
            <SelectItem value="api">Sales Data API</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insights Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {filteredInsights.map((insight, index) => (
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
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold">{metric.value}</span>
                        {metric.change && (
                          <Badge
                            variant={
                              metric.change.startsWith("+") ? "success" : "destructive"
                            }
                            className="text-xs"
                          >
                            {metric.change}
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

      {filteredInsights.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No insights found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or generate new insights
          </p>
        </div>
      )}
    </div>
  );
}
