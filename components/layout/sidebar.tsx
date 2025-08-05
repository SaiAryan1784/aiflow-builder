"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Layers,
  Bot,
  Database,
  GitBranch,
  Settings,
  FileText,
  Zap,
  Box,
} from "lucide-react"

const tools = [
  {
    title: "AI Models",
    icon: Bot,
    items: [
      { name: "GPT-4", description: "OpenAI's latest model" },
      { name: "Claude", description: "Anthropic's AI assistant" },
      { name: "Custom Model", description: "Your own AI model" },
    ],
  },
  {
    title: "Data Sources",
    icon: Database,
    items: [
      { name: "API Endpoint", description: "REST API connection" },
      { name: "Database", description: "SQL/NoSQL database" },
      { name: "File Upload", description: "CSV, JSON, etc." },
    ],
  },
  {
    title: "Logic",
    icon: GitBranch,
    items: [
      { name: "Condition", description: "If/else branching" },
      { name: "Loop", description: "Iterate over data" },
      { name: "Transform", description: "Data manipulation" },
    ],
  },
  {
    title: "Actions",
    icon: Zap,
    items: [
      { name: "HTTP Request", description: "Make API calls" },
      { name: "Send Email", description: "Email notifications" },
      { name: "Webhook", description: "Trigger webhooks" },
    ],
  },
]

export function Sidebar() {
  const [selectedTool, setSelectedTool] = React.useState("AI Models")

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="p-4">
        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
          Tools
        </h2>
        <div className="space-y-1">
          {tools.map((category) => (
            <Button
              key={category.title}
              variant={selectedTool === category.title ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTool(category.title)}
            >
              <category.icon className="mr-2 h-4 w-4" />
              {category.title}
            </Button>
          ))}
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {tools
            .find((t) => t.title === selectedTool)
            ?.items.map((item) => (
              <div
                key={item.name}
                className="group cursor-move rounded-lg border p-3 transition-colors hover:border-primary"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow", item.name)
                  e.dataTransfer.effectAllowed = "move"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Box className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-4">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  )
}
