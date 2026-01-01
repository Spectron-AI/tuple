"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Slack and Teams icons as inline SVGs
const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
);

const TeamsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M20.625 8.073c.574 0 1.125.224 1.53.624.407.4.636.943.636 1.509v4.588c0 1.696-.68 3.323-1.892 4.523A6.476 6.476 0 0 1 16.34 21.2a6.476 6.476 0 0 1-4.559-1.883 6.374 6.374 0 0 1-1.892-4.523v-2.522a.532.532 0 0 1 .159-.377.54.54 0 0 1 .382-.156h7.094V8.606c0-.141.057-.277.158-.377a.54.54 0 0 1 .382-.156h2.561zm-3.635-2.405a2.4 2.4 0 0 0 2.413-2.384A2.4 2.4 0 0 0 16.99.9a2.4 2.4 0 0 0-2.412 2.384 2.4 2.4 0 0 0 2.412 2.384zM8.79 6.735a3.2 3.2 0 0 0 3.217-3.18A3.2 3.2 0 0 0 8.79.376a3.2 3.2 0 0 0-3.216 3.18 3.2 3.2 0 0 0 3.216 3.18zm3.023 1.066H2.93a.54.54 0 0 0-.382.156.532.532 0 0 0-.158.377v6.46c0 1.696.68 3.323 1.892 4.523a6.476 6.476 0 0 0 4.559 1.883c.843 0 1.678-.163 2.456-.48a8.053 8.053 0 0 1-1.77-5.018v-5.768a2.13 2.13 0 0 1 .635-1.51 2.16 2.16 0 0 1 1.53-.623h.122z" />
  </svg>
);

const mockIntegrations = [
  {
    id: "1",
    name: "Marketing Team Slack",
    type: "slack",
    status: "active",
    channel: "#data-insights",
    lastActive: "2 minutes ago",
  },
  {
    id: "2",
    name: "Executive Reports",
    type: "teams",
    status: "active",
    channel: "Executive Team",
    lastActive: "1 hour ago",
  },
  {
    id: "3",
    name: "Sales Alerts",
    type: "slack",
    status: "inactive",
    channel: "#sales-alerts",
    lastActive: "3 days ago",
  },
];

export default function IntegrationsPage() {
  const [isSlackDialogOpen, setIsSlackDialogOpen] = useState(false);
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (type: string) => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(false);
    if (type === "slack") {
      setIsSlackDialogOpen(false);
    } else {
      setIsTeamsDialogOpen(false);
    }
    toast.success(`${type === "slack" ? "Slack" : "Teams"} integration connected successfully!`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect Tuple to your favorite communication tools
          </p>
        </div>
      </div>

      {/* Available Integrations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Slack Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#4A154B] text-white">
                <SlackIcon />
              </div>
              <div>
                <CardTitle>Slack</CardTitle>
                <CardDescription>
                  Send insights and alerts to Slack channels
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Ask questions about your data directly in Slack
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Receive automated insight notifications
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Schedule daily/weekly data reports
              </li>
            </ul>
            <Dialog open={isSlackDialogOpen} onOpenChange={setIsSlackDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Connect Slack
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Slack</DialogTitle>
                  <DialogDescription>
                    Enter your Slack workspace details to enable the integration.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="slackToken">Bot Token</Label>
                    <Input
                      id="slackToken"
                      placeholder="xoxb-your-token-here"
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Create a Slack app and get the bot token from OAuth & Permissions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slackChannel">Default Channel</Label>
                    <Input id="slackChannel" placeholder="#data-insights" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive alerts for new insights
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSlackDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleConnect("slack")} disabled={isConnecting}>
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
          </CardContent>
        </Card>

        {/* Teams Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#5558AF] text-white">
                <TeamsIcon />
              </div>
              <div>
                <CardTitle>Microsoft Teams</CardTitle>
                <CardDescription>
                  Share insights with your Teams channels
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Interactive bot for natural language queries
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Adaptive cards for rich data visualization
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Meeting summaries with data context
              </li>
            </ul>
            <Dialog open={isTeamsDialogOpen} onOpenChange={setIsTeamsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Connect Teams
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Microsoft Teams</DialogTitle>
                  <DialogDescription>
                    Enter your Teams webhook URL to enable the integration.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamsWebhook">Incoming Webhook URL</Label>
                    <Input
                      id="teamsWebhook"
                      placeholder="https://outlook.office.com/webhook/..."
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Create an incoming webhook connector in your Teams channel
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamsName">Integration Name</Label>
                    <Input id="teamsName" placeholder="Data Insights Bot" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Adaptive Cards</Label>
                      <p className="text-xs text-muted-foreground">
                        Rich formatting for messages
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTeamsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleConnect("teams")} disabled={isConnecting}>
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
          </CardContent>
        </Card>
      </div>

      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>Manage your active integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockIntegrations.map((integration) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${
                      integration.type === "slack" ? "bg-[#4A154B]" : "bg-[#5558AF]"
                    }`}
                  >
                    {integration.type === "slack" ? <SlackIcon /> : <TeamsIcon />}
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {integration.channel} • Last active: {integration.lastActive}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={integration.status === "active" ? "success" : "secondary"}
                    className="gap-1"
                  >
                    {integration.status === "active" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {integration.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="bg-muted/50">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <h3 className="font-semibold">Need help setting up integrations?</h3>
            <p className="text-sm text-muted-foreground">
              Check out our documentation for step-by-step guides
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
