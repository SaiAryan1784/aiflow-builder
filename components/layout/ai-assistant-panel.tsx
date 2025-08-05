"use client"

import * as React from "react"
import { useReactFlow } from 'reactflow'
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Sparkles, X, MessageSquare, Loader2 } from "lucide-react"
import { TypingIndicator } from "@/components/ui/typing-indicator"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface FlowDiff {
  action: string
  nodeId?: string
  nodeType?: 'dataSource' | 'aiModel' | 'action'
  nodeLabel?: string
  nodePosition?: { x: number; y: number }
  sourceId?: string
  targetId?: string
  edgeId?: string
  explanation?: string
}

interface AIAssistantPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function AIAssistantPanel({ isOpen, onToggle }: AIAssistantPanelProps) {
  const { getNodes, setNodes, getEdges, setEdges, addNodes, deleteElements } = useReactFlow();
  const [messages, setMessages] = React.useState<Message[]>([])
  const [showWelcome, setShowWelcome] = React.useState(true)
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Fix hydration error by ensuring client-side rendering for timestamps
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Helper function to find node by label or ID
  const findNodeByReference = (reference: string) => {
    const nodes = getNodes()
    // First try to find by exact ID
    let node = nodes.find(n => n.id === reference)
    if (node) return node
    
    // Then try to find by label (case insensitive)
    node = nodes.find(n => n.data.label.toLowerCase() === reference.toLowerCase())
    if (node) return node
    
    // Try partial label match
    node = nodes.find(n => n.data.label.toLowerCase().includes(reference.toLowerCase()))
    if (node) return node
    
    // Try by node type
    node = nodes.find(n => n.type === reference)
    if (node) return node
    
    return null
  }

  // Helper function to generate unique but predictable node IDs
  const generateNodeId = (nodeType: string, label: string) => {
    const baseId = `${nodeType}-${label.toLowerCase().replace(/\s+/g, '-')}`
    const nodes = getNodes()
    let counter = 1
    let finalId = baseId
    
    // Ensure uniqueness
    while (nodes.find(n => n.id === finalId)) {
      finalId = `${baseId}-${counter}`
      counter++
    }
    
    return finalId
  }

  const applyFlowDiff = (flowDiff: FlowDiff) => {
    const edges = getEdges()
    
    switch (flowDiff.action) {
      case 'add_node': {
        const nodeLabel = flowDiff.nodeLabel || 'New Node'
        const nodeType = flowDiff.nodeType || 'action'
        const newNode = {
          id: generateNodeId(nodeType, nodeLabel),
          type: nodeType,
          position: flowDiff.nodePosition || { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
          data: {
            label: nodeLabel
          }
        }
        addNodes(newNode)
        break
      }
      case 'delete_node': {
        if (flowDiff.nodeId) {
          // Try to find node by ID or label
          const nodeToDelete = findNodeByReference(flowDiff.nodeId)
          if (nodeToDelete) {
            deleteElements({ nodes: [nodeToDelete] })
          }
        }
        break
      }
      case 'add_edge': {
        if (flowDiff.sourceId && flowDiff.targetId) {
          // Find source and target nodes by reference
          const sourceNode = findNodeByReference(flowDiff.sourceId)
          const targetNode = findNodeByReference(flowDiff.targetId)
          
          if (sourceNode && targetNode) {
            // Check if edge already exists
            const existingEdge = edges.find(e => 
              e.source === sourceNode.id && e.target === targetNode.id
            )
            
            if (!existingEdge) {
              const newEdge = {
                id: `edge-${sourceNode.id}-${targetNode.id}`,
                source: sourceNode.id,
                target: targetNode.id,
                type: 'custom'
              }
              setEdges([...edges, newEdge])
            }
          }
        }
        break
      }
      case 'delete_edge': {
        if (flowDiff.edgeId) {
          setEdges(edges.filter(e => e.id !== flowDiff.edgeId))
        } else if (flowDiff.sourceId && flowDiff.targetId) {
          // Delete edge by source and target references
          const sourceNode = findNodeByReference(flowDiff.sourceId)
          const targetNode = findNodeByReference(flowDiff.targetId)
          
          if (sourceNode && targetNode) {
            setEdges(edges.filter(e => 
              !(e.source === sourceNode.id && e.target === targetNode.id)
            ))
          }
        }
        break
      }
      case 'clear_all': {
        setNodes([])
        setEdges([])
        break
      }
    }
  }

  const handleSend = () => {
    if (!input.trim()) return

    // Hide welcome message when first message is sent
    if (showWelcome) {
      setShowWelcome(false)
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setIsLoading(true)

    // Get current flow state to provide context to AI
    const currentNodes = getNodes()
    const currentEdges = getEdges()
    
    // Create a simple description of current nodes for the AI
    const nodeDescriptions = currentNodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.data.label,
      position: node.position
    }))

    // Fetch AI response using LangChain + Groq
    fetch('/api/get-flow-diff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: input,
        currentNodes: nodeDescriptions,
        currentEdges: currentEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target
        }))
      })
    }).then(res => res.json()).then(data => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process your request.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
      
      // Apply flow changes if there's a diff
      if (data.flowDiff) {
        applyFlowDiff(data.flowDiff)
      }
    }).catch(error => {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
    })
  }

  React.useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      {/* Toggle Button - Always visible */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed right-4 top-20 z-50"
      >
        <Button
          size="icon"
          variant="outline"
          onClick={onToggle}
          className="bg-background/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow"
        >
          {isOpen ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        </Button>
      </motion.div>

      {/* AI Assistant Panel with animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed right-0 top-16 flex h-[calc(100vh-4rem)] w-80 flex-col border-l bg-background/95 backdrop-blur-sm shadow-xl z-40 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 p-4"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Assistant</h2>
            </motion.div>
            <Separator />
            <ScrollArea className="flex-1 h-0">
              <div className="p-4 space-y-4 min-h-full">
                {messages.length === 0 && showWelcome && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <Card className="bg-muted p-4 max-w-[85%]">
                      <div className="text-sm space-y-3">
                        <p className="font-medium text-foreground">
                          Hello! I&apos;m your AI assistant. I can help you build flows, connect nodes, and answer questions.
                        </p>
                        <p className="text-muted-foreground">
                          I can now see your current flow state and work with existing nodes!
                        </p>
                        
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Try commands like:</p>
                          <ul className="space-y-1 text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Add a data source node&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Connect Data Source to GPT-4&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Connect the first node to the second node&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Delete the action node&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Explain what this flow does&apos;</span>
                            </li>
                          </ul>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          💡 I can reference nodes by their labels, IDs, or descriptions!
                        </p>
                      </div>
                    </Card>
                  </div>
                )}
                
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
                        >
                          <Bot className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                      <motion.div
                        initial={{
                          opacity: 0,
                          x: message.role === "user" ? 20 : -20,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-[80%]"
                      >
                        <Card
                          className={`p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`mt-1 text-xs ${
                              message.role === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isClient ? message.timestamp.toLocaleTimeString() : ''}
                          </p>
                        </Card>
                      </motion.div>
                      {message.role === "user" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary"
                        >
                          <User className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-3 justify-start"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
                      >
                        <Bot className="h-4 w-4 text-primary" />
                      </motion.div>
                      <Card className="bg-muted">
                        <TypingIndicator />
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <Separator />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4"
            >
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="transition-all hover:scale-105"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
