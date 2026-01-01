"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Database,
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
  Trash2,
  Settings,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";

const dataSourceTypes = [
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "mongodb", name: "MongoDB", icon: "🍃" },
  { id: "sqlite", name: "SQLite", icon: "📦" },
  { id: "snowflake", name: "Snowflake", icon: "❄️" },
  { id: "bigquery", name: "BigQuery", icon: "📊" },
  { id: "redshift", name: "Redshift", icon: "🔴" },
  { id: "csv", name: "CSV File", icon: "📄" },
  { id: "rest_api", name: "REST API", icon: "🔗" },
];

const mockDataSources = [
  {
    id: "1",
    name: "Production PostgreSQL",
    type: "postgresql",
    status: "connected",
    lastSync: "2 minutes ago",
    tables: 24,
    rows: "1.2M",
  },
  {
    id: "2",
    name: "Analytics MongoDB",
    type: "mongodb",
    status: "connected",
    lastSync: "5 minutes ago",
    tables: 12,
    rows: "850K",
  },
  {
    id: "3",
    name: "Sales Data API",
    type: "rest_api",
    status: "connected",
    lastSync: "10 minutes ago",
    tables: 8,
    rows: "250K",
  },
  {
    id: "4",
    name: "Customer CSV Export",
    type: "csv",
    status: "disconnected",
    lastSync: "1 hour ago",
    tables: 1,
    rows: "50K",
  },
];

export default function DataSourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const filteredSources = mockDataSources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setIsDialogOpen(false);
    toast.success("Data source connected successfully!");
  };

  const getTypeIcon = (type: string) => {
    const found = dataSourceTypes.find((t) => t.id === type);
    return found?.icon || "📊";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground">
            Connect and manage your data sources
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Data Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Connect New Data Source</DialogTitle>
              <DialogDescription>
                Choose a data source type and enter your connection details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Data Source Type Selection */}
              <div className="space-y-3">
                <Label>Select Data Source Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {dataSourceTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                        selectedType === type.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-sm font-medium">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Connection Details */}
              {selectedType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Connection Name</Label>
                      <Input id="name" placeholder="My Database" />
                    </div>
                    {selectedType !== "csv" && selectedType !== "rest_api" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="host">Host</Label>
                          <Input id="host" placeholder="localhost" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="port">Port</Label>
                          <Input id="port" placeholder="5432" type="number" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="database">Database</Label>
                          <Input id="database" placeholder="mydb" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" placeholder="postgres" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" placeholder="••••••••" />
                        </div>
                      </>
                    )}
                    {selectedType === "rest_api" && (
                      <>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="url">API Base URL</Label>
                          <Input id="url" placeholder="https://api.example.com" />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="apiKey">API Key (optional)</Label>
                          <Input id="apiKey" placeholder="Your API key" />
                        </div>
                      </>
                    )}
                    {selectedType === "csv" && (
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="file">Upload CSV File</Label>
                        <Input id="file" type="file" accept=".csv" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={!selectedType || isConnecting}>
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {dataSourceTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.icon} {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Sources Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredSources.map((source) => (
          <motion.div
            key={source.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                      {getTypeIcon(source.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {source.type.replace("_", " ")}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Schema
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="h-4 w-4" />
                      <span>{source.tables} tables</span>
                      <span>•</span>
                      <span>{source.rows} rows</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last synced: {source.lastSync}
                    </p>
                  </div>
                  <Badge
                    variant={source.status === "connected" ? "success" : "secondary"}
                    className="gap-1"
                  >
                    {source.status === "connected" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {source.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredSources.length === 0 && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No data sources found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "Get started by connecting your first data source"}
          </p>
        </div>
      )}
    </div>
  );
}
