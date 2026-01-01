"use client";

import { useState } from "react";
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

const mockDataSources = [
  {
    id: "1",
    name: "Production PostgreSQL",
    type: "postgresql",
    tables: [
      {
        name: "users",
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "email", type: "varchar(255)" },
          { name: "name", type: "varchar(255)" },
          { name: "created_at", type: "timestamp" },
        ],
        rowCount: 15234,
      },
      {
        name: "orders",
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "user_id", type: "uuid" },
          { name: "total", type: "decimal(10,2)" },
          { name: "status", type: "varchar(50)" },
          { name: "created_at", type: "timestamp" },
        ],
        rowCount: 87654,
      },
      {
        name: "products",
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "name", type: "varchar(255)" },
          { name: "price", type: "decimal(10,2)" },
          { name: "category", type: "varchar(100)" },
          { name: "stock", type: "integer" },
        ],
        rowCount: 1250,
      },
    ],
  },
];

const mockQueryResults = [
  { id: "1", email: "john@example.com", name: "John Doe", orders: 45, revenue: 12500.0 },
  { id: "2", email: "jane@example.com", name: "Jane Smith", orders: 32, revenue: 8750.5 },
  { id: "3", email: "bob@example.com", name: "Bob Wilson", orders: 28, revenue: 7200.0 },
  { id: "4", email: "alice@example.com", name: "Alice Brown", orders: 25, revenue: 6800.0 },
  { id: "5", email: "charlie@example.com", name: "Charlie Davis", orders: 22, revenue: 5900.0 },
];

export default function ExplorerPage() {
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const currentDataSource = mockDataSources.find((ds) => ds.id === selectedDataSource);
  const currentTable = currentDataSource?.tables.find((t) => t.name === selectedTable);

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    // Simulate query execution
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setResults(mockQueryResults);
    setExecutionTime(Date.now() - startTime);
    setIsExecuting(false);
    toast.success("Query executed successfully");
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
              {mockDataSources.map((ds) => (
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
                        {table.rowCount.toLocaleString()}
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
                            {col.primaryKey && (
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
      <div className="flex-1 flex flex-col gap-6">
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
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
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
          <CardContent className="flex-1 overflow-auto p-0">
            {results ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {Object.keys(results[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left font-medium border-b"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-4 py-2">
                            {typeof value === "number"
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
