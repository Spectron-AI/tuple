"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Sparkles,
  MessageSquare,
  Plug,
  ArrowRight,
  Check,
  Zap,
  Shield,
  BarChart3,
  Bot,
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Database,
    title: "Universal Data Connectors",
    description:
      "Connect to PostgreSQL, MySQL, MongoDB, Snowflake, REST APIs, CSV files and more with secure, reliable connections.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description:
      "Leverage LLM intelligence to automatically discover patterns, anomalies, and actionable insights from your data.",
  },
  {
    icon: MessageSquare,
    title: "Natural Language Queries",
    description:
      "Ask questions about your data in plain English. Get instant SQL translations and visual results.",
  },
  {
    icon: Plug,
    title: "Team Integrations",
    description:
      "Connect with Slack and Microsoft Teams to share insights and query data directly from your communication tools.",
  },
  {
    icon: BarChart3,
    title: "Smart Visualizations",
    description:
      "Automatically generate charts, graphs, and dashboards that best represent your data insights.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access control, encryption at rest and in transit, and audit logging for compliance.",
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Tuple</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="#integrations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Integrations
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            Intelligent Data Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Turn Your Data Into
            <span className="text-gradient block">Intelligent Insights</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect any data source, ask questions in natural language, and get AI-powered
            insights delivered to your favorite tools like Slack and Teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="xl" variant="gradient" className="gap-2">
                Start Exploring <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="xl" variant="outline" className="gap-2">
              <Bot className="h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Hero Image/Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
          <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
            <div className="p-4 border-b bg-muted/50 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-sm text-muted-foreground">
                Tuple Dashboard
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 min-h-[400px] flex items-center justify-center">
              <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      AI Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        What are my top performing products this quarter?
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3 text-sm">
                        Based on your sales data, here are the top 5 products...
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">$1.2M</div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-500">+23%</div>
                      <div className="text-sm text-muted-foreground">Growth</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for Data Intelligence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete platform to connect, analyze, and share insights from all your data sources.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="container py-24 border-t">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get from raw data to actionable insights in three simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Connect Your Data",
              description:
                "Add your databases, APIs, and files. We support 15+ data sources with secure, encrypted connections.",
            },
            {
              step: "02",
              title: "Ask Questions",
              description:
                "Use natural language to query your data. Our AI translates your questions into optimized SQL.",
            },
            {
              step: "03",
              title: "Get Insights",
              description:
                "Receive AI-generated insights, alerts, and reports directly in Slack, Teams, or your dashboard.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-gradient-to-r from-primary to-blue-500 p-12 md:p-16 text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Data Experience?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using Tuple to make smarter, data-driven decisions.
          </p>
          <Link href="/dashboard">
            <Button size="xl" variant="secondary" className="gap-2">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Tuple</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Tuple. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
