"use client";

import { useState, useEffect } from "react";
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
  { id: "postgresql", name: "PostgreSQL", icon: "🐘", defaultPort: "5432" },
  { id: "mysql", name: "MySQL", icon: "🐬", defaultPort: "3306" },
  { id: "mongodb", name: "MongoDB", icon: "🍃", defaultPort: "27017" },
  { id: "sqlite", name: "SQLite", icon: "📦", defaultPort: "" },
  { id: "snowflake", name: "Snowflake", icon: "❄️", defaultPort: "" },
  { id: "bigquery", name: "BigQuery", icon: "📊", defaultPort: "" },
  { id: "redshift", name: "Redshift", icon: "🔴", defaultPort: "5439" },
  { id: "csv", name: "CSV File", icon: "📄", defaultPort: "" },
  { id: "rest_api", name: "REST API", icon: "🔗", defaultPort: "" },
];

interface ConnectionForm {
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  url: string;
  apiKey: string;
}

export default function DataSourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [dataSources, setDataSources] = useState<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    tables: number;
    lastConnected?: string;
  }>>([]);
  const [formData, setFormData] = useState<ConnectionForm>({
    name: "",
    host: "localhost",
    port: "",
    database: "",
    username: "",
    password: "",
    url: "",
    apiKey: "",
  });

  // Load data sources from API
  const loadDataSources = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/datasources");
      if (response.ok) {
        const sources = await response.json();
        setDataSources(sources.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          status: s.status || "connected",
          tables: s.schema_data?.tables?.length || 0,
          lastConnected: s.last_synced,
        })));
      }
    } catch (error) {
      console.error("Failed to load data sources:", error);
    }
  };

  useEffect(() => {
    loadDataSources();
  }, []);

  const filteredSources = dataSources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const typeInfo = dataSourceTypes.find(t => t.id === typeId);
    if (typeInfo) {
      setFormData(prev => ({ ...prev, port: typeInfo.defaultPort }));
    }
  };

  const handleInputChange = (field: keyof ConnectionForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setSelectedType("");
    setFormData({
      name: "",
      host: "localhost",
      port: "",
      database: "",
      username: "",
      password: "",
      url: "",
      apiKey: "",
    });
  };

  const handleConnect = async () => {
    if (!formData.name) {
      toast.error("Please enter a connection name");
      return;
    }

    setIsConnecting(true);

    try {
      // Build connection config based on type
      let connectionConfig: Record<string, unknown> = {};
      
      if (selectedType === "rest_api") {
        connectionConfig = {
          url: formData.url,
          api_key: formData.apiKey,
        };
      } else if (selectedType === "csv") {
        connectionConfig = {
          file_path: formData.name,
        };
      } else {
        connectionConfig = {
          host: formData.host,
          port: parseInt(formData.port) || undefined,
          database: formData.database,
          username: formData.username,
          password: formData.password,
        };
      }

      // Call the API to create the data source
      const response = await fetch("http://localhost:8000/api/v1/datasources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: selectedType,
          config: connectionConfig,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to connect to data source");
      }

      // Reload data sources from API to get fresh list
      await loadDataSources();

      toast.success("Data source connected successfully!");
      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      console.error("Connection error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to data source";
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      // Call API to delete
      const response = await fetch(`http://localhost:8000/api/v1/datasources/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete data source");
      }

      // Reload data sources from API
      await loadDataSources();
      toast.success(`${name} has been deleted`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete data source";
      toast.error(errorMessage);
    }
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
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
                      onClick={() => handleTypeSelect(type.id)}
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
                      <Input 
                        id="name" 
                        placeholder="My Database" 
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>
                    {selectedType !== "csv" && selectedType !== "rest_api" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="host">Host</Label>
                          <Input 
                            id="host" 
                            placeholder="localhost" 
                            value={formData.host}
                            onChange={(e) => handleInputChange("host", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="port">Port</Label>
                          <Input 
                            id="port" 
                            placeholder="3306" 
                            type="number" 
                            value={formData.port}
                            onChange={(e) => handleInputChange("port", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="database">Database</Label>
                          <Input 
                            id="database" 
                            placeholder="mydb" 
                            value={formData.database}
                            onChange={(e) => handleInputChange("database", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input 
                            id="username" 
                            placeholder="root" 
                            value={formData.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    {selectedType === "rest_api" && (
                      <>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="url">API Base URL</Label>
                          <Input 
                            id="url" 
                            placeholder="https://api.example.com" 
                            value={formData.url}
                            onChange={(e) => handleInputChange("url", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="apiKey">API Key (optional)</Label>
                          <Input 
                            id="apiKey" 
                            placeholder="Your API key" 
                            value={formData.apiKey}
                            onChange={(e) => handleInputChange("apiKey", e.target.value)}
                          />
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
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(source.id, source.name)}
                      >
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
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.lastConnected 
                        ? `Last connected: ${new Date(source.lastConnected).toLocaleString()}` 
                        : "Never connected"}
                    </p>
                  </div>
                  <Badge
                    variant={source.status === "connected" ? "default" : "secondary"}
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
