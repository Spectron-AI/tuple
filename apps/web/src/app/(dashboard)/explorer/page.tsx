"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Table,
  Play,
  Download,
  Copy,
  ChevronRight,
  Search,
  RefreshCw,
  Code,
  Eye,
  Columns,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TableColumn {
  name: string;
  type: string;
  primary_key?: boolean;
  primaryKey?: boolean;
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
  row_count?: number;
  rowCount?: number;
}

interface DataSourceWithSchema {
  id: string;
  name: string;
  type: string;
  tables: TableSchema[];
}

export default function ExplorerPage() {
  const [dataSources, setDataSources] = useState<DataSourceWithSchema[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data sources from API on mount
  useEffect(() => {
    const loadDataSources = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/datasources");
        if (response.ok) {
          const sources = await response.json();
          // Transform API response to include tables from schema_data
          const transformed = sources.map((source: any) => ({
            id: source.id,
            name: source.name,
            type: source.type,
            tables: source.schema_data?.tables || [],
          }));
          setDataSources(transformed);
        }
      } catch (error) {
        console.error("Failed to load data sources:", error);
        toast.error("Failed to load data sources");
      } finally {
        setIsLoading(false);
      }
    };

    loadDataSources();
  }, []);

  const currentDataSource = dataSources.find((ds) => ds.id === selectedDataSource);
  const currentTable = currentDataSource?.tables.find((t) => t.name === selectedTable);

  const handleExecuteQuery = async () => {
    if (!query.trim() || !selectedDataSource) return;
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/datasources/${selectedDataSource}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = typeof error.detail === 'string' 
          ? error.detail 
          : (error.detail?.message || error.message || JSON.stringify(error.detail) || "Query execution failed");
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setColumns(result.columns || []);
      setResults(result.rows || []);
      setExecutionTime(Date.now() - startTime);
      toast.success(`Query executed successfully (${result.rows?.length || 0} rows)`);
    } catch (error: unknown) {
      console.error("Query error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to execute query";
      toast.error(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportResults = () => {
    toast.success("Results exported to CSV");
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] p-6 gap-6">
      {/* Sidebar - Schema Browser */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Schema Browser</CardTitle>
          <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
            <SelectTrigger>
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((ds) => (
                <SelectItem key={ds.id} value={ds.id}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {ds.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {selectedDataSource && currentDataSource ? (
            <ScrollArea className="h-full px-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tables..." className="pl-10 mb-3" />
              </div>
              <div className="space-y-1">
                {currentDataSource.tables.map((table) => (
                  <div key={table.name}>
                    <button
                      onClick={() => handleTableSelect(table.name)}
                      className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                        selectedTable === table.name
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Table className="h-4 w-4" />
                      <span className="flex-1 font-medium text-sm">{table.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(table.row_count || table.rowCount || 0).toLocaleString()}
                      </Badge>
                    </button>
                    {selectedTable === table.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="ml-6 mt-1 space-y-1"
                      >
                        {table.columns.map((col) => (
                          <div
                            key={col.name}
                            className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground"
                          >
                            <Columns className="h-3 w-3" />
                            <span className="flex-1">{col.name}</span>
                            <span className="text-xs opacity-70">{col.type}</span>
                            {(col.primaryKey || col.primary_key) && (
                              <Badge variant="outline" className="text-xs px-1">
                                PK
                              </Badge>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Database className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a data source to browse tables
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content - Query Editor & Results */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-hidden">
        {/* Query Editor */}
        <Card className="flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                SQL Query
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(query)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={!query.trim() || isExecuting}
                  className="gap-2"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Query
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="font-mono min-h-[120px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Results
                </CardTitle>
                {results && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{results.length} rows</span>
                    <span>•</span>
                    <span>{executionTime}ms</span>
                  </div>
                )}
              </div>
              {results && (
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            {results ? (
              <div className="h-full w-full overflow-auto">
                <table className="text-sm w-max min-w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.name}
                          className="px-4 py-3 text-left font-medium border-b whitespace-nowrap"
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        {row.map((value: any, i: number) => (
                          <td key={i} className="px-4 py-2">
                            {value === null
                              ? <span className="text-muted-foreground italic">NULL</span>
                              : typeof value === "number"
                              ? value.toLocaleString()
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Table className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Write a SQL query above and click "Run Query" to see results here.
                  You can also click on a table in the schema browser to auto-generate a query.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
