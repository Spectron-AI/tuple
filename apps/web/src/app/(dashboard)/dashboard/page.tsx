"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  TrendingUp,
  Users,
  Zap,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MessageSquare,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const stats = [
  {
    title: "Data Sources",
    value: "12",
    change: "+2",
    changeType: "positive",
    icon: Database,
  },
  {
    title: "Queries Today",
    value: "1,234",
    change: "+15%",
    changeType: "positive",
    icon: Zap,
  },
  {
    title: "AI Insights",
    value: "48",
    change: "+8",
    changeType: "positive",
    icon: Sparkles,
  },
  {
    title: "Active Users",
    value: "24",
    change: "-3",
    changeType: "negative",
    icon: Users,
  },
];

const recentDataSources = [
  { name: "Production PostgreSQL", type: "postgresql", status: "connected", lastSync: "2 min ago" },
  { name: "Analytics MongoDB", type: "mongodb", status: "connected", lastSync: "5 min ago" },
  { name: "Sales API", type: "rest_api", status: "connected", lastSync: "10 min ago" },
  { name: "Customer Data CSV", type: "csv", status: "disconnected", lastSync: "1 hour ago" },
];

const recentInsights = [
  {
    title: "Revenue Trend Detected",
    description: "Monthly revenue has increased by 23% compared to last quarter",
    type: "trend",
    severity: "info",
  },
  {
    title: "Unusual Traffic Pattern",
    description: "API traffic spike detected at 3 AM - 40% above normal",
    type: "anomaly",
    severity: "warning",
  },
  {
    title: "Customer Churn Prediction",
    description: "15 customers identified at high risk of churn this month",
    type: "recommendation",
    severity: "critical",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your data intelligence platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/datasources/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Data Source
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs">
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={
                      stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Data Sources */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>Your connected data sources</CardDescription>
                </div>
                <Link href="/datasources">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDataSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {source.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{source.lastSync}</span>
                      <Badge
                        variant={source.status === "connected" ? "success" : "secondary"}
                      >
                        {source.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>Latest discoveries from your data</CardDescription>
                </div>
                <Link href="/insights">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{insight.title}</p>
                          <Badge
                            variant={
                              insight.severity === "critical"
                                ? "destructive"
                                : insight.severity === "warning"
                                ? "warning"
                                : "info"
                            }
                          >
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} initial="hidden" animate="show">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/chat">
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-pointer group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Ask AI</p>
                    <p className="text-sm text-muted-foreground">
                      Query your data with natural language
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/explorer">
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-pointer group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Explore Data</p>
                    <p className="text-sm text-muted-foreground">
                      Browse and query your databases
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/insights">
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-pointer group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Generate Insights</p>
                    <p className="text-sm text-muted-foreground">
                      Let AI analyze your data patterns
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
