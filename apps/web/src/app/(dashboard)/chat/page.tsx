"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Sparkles,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Database,
  Table,
  RefreshCw,
  Code,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  query?: string;
  results?: any[];
}

const mockDataSources = [
  { id: "1", name: "Production PostgreSQL", type: "postgresql" },
  { id: "2", name: "Analytics MongoDB", type: "mongodb" },
  { id: "3", name: "Sales Data API", type: "rest_api" },
];

const suggestedQuestions = [
  "What are the top 10 customers by revenue?",
  "Show me the monthly sales trend for 2024",
  "Which products have the highest return rate?",
  "What's the average order value by region?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedDataSource) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Based on your question about "${input}", I've analyzed the data and here's what I found:

The query reveals interesting patterns in your data. Here are the key insights:

1. **Top Performers**: The data shows a clear trend of increasing engagement
2. **Key Metrics**: Average values are within expected ranges
3. **Recommendations**: Consider optimizing based on the patterns observed`,
      timestamp: new Date(),
      query: `SELECT customer_name, SUM(revenue) as total_revenue
FROM orders o
JOIN customers c ON o.customer_id = c.id
GROUP BY customer_name
ORDER BY total_revenue DESC
LIMIT 10;`,
      results: [
        { customer_name: "Acme Corp", total_revenue: 125000 },
        { customer_name: "TechStart Inc", total_revenue: 98500 },
        { customer_name: "Global Traders", total_revenue: 87200 },
        { customer_name: "DataFlow LLC", total_revenue: 76800 },
        { customer_name: "CloudNine", total_revenue: 65400 },
      ],
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Chat
          </h1>
          <p className="text-muted-foreground">
            Ask questions about your data in natural language
          </p>
        </div>
        <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a data source" />
          </SelectTrigger>
          <SelectContent>
            {mockDataSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {source.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Ask questions about your data in natural language. I'll translate them
                into queries and provide insights.
              </p>
              {selectedDataSource ? (
                <div className="grid gap-2 max-w-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Try asking:
                  </p>
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start h-auto py-3 px-4"
                      onClick={() => handleSuggestionClick(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Please select a data source to start chatting
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] space-y-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3"
                          : ""
                      }`}
                    >
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        {message.content}
                      </div>

                      {message.query && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="gap-1">
                              <Code className="h-3 w-3" />
                              Generated SQL
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.query!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <SyntaxHighlighter
                            language="sql"
                            style={oneDark}
                            customStyle={{
                              borderRadius: "0.5rem",
                              margin: 0,
                              fontSize: "0.875rem",
                            }}
                          >
                            {message.query}
                          </SyntaxHighlighter>
                        </div>
                      )}

                      {message.results && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="gap-1">
                              <Table className="h-3 w-3" />
                              Results
                            </Badge>
                          </div>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  {Object.keys(message.results[0]).map((key) => (
                                    <th
                                      key={key}
                                      className="px-4 py-2 text-left font-medium"
                                    >
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {message.results.map((row, index) => (
                                  <tr key={index} className="border-t">
                                    {Object.values(row).map((value: any, i) => (
                                      <td key={i} className="px-4 py-2">
                                        {typeof value === "number"
                                          ? value.toLocaleString()
                                          : value}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Analyzing your data...</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-3">
            <Input
              placeholder={
                selectedDataSource
                  ? "Ask a question about your data..."
                  : "Select a data source first"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={!selectedDataSource || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || !selectedDataSource || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
