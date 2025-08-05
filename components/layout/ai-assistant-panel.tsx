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

interface FlowOperation {
  action: string
  nodeId?: string
  nodeType?: 'dataSource' | 'aiModel' | 'action'
  nodeLabel?: string
  nodePosition?: { x: number; y: number }
  sourceId?: string
  targetId?: string
  edgeId?: string
  updateData?: {
    label?: string
    type?: 'dataSource' | 'aiModel' | 'action'
    position?: { x: number; y: number }
  }
}

interface FlowDiff {
  type: 'single' | 'multiple' | 'explain'
  operation?: FlowOperation
  operations?: FlowOperation[]
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

  const applyFlowOperation = (operation: FlowOperation) => {
    console.log('Applying operation:', operation)
    const edges = getEdges()
    
    switch (operation.action) {
      case 'add_node': {
        const nodeLabel = operation.nodeLabel || 'New Node'
        const nodeType = operation.nodeType || 'action'
        const newNode = {
          id: generateNodeId(nodeType, nodeLabel),
          type: nodeType,
          position: operation.nodePosition || { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
          data: {
            label: nodeLabel
          }
        }
        console.log('Adding node:', newNode)
        addNodes(newNode)
        break
      }
      case 'update_node': {
        if (operation.nodeId && operation.updateData) {
          const nodeToUpdate = findNodeByReference(operation.nodeId)
          console.log('Found node to update:', nodeToUpdate, 'with data:', operation.updateData)
          if (nodeToUpdate) {
            const currentNodes = getNodes()
            const updatedNodes = currentNodes.map(node => {
              if (node.id === nodeToUpdate.id) {
                const updatedNode = {
                  ...node,
                  type: operation.updateData?.type || node.type,
                  position: operation.updateData?.position || node.position,
                  data: {
                    ...node.data,
                    label: operation.updateData?.label || node.data.label
                  }
                }
                console.log('Updated node:', updatedNode)
                return updatedNode
              }
              return node
            })
            setNodes(updatedNodes)
          } else {
            console.log('Node not found for ID:', operation.nodeId)
          }
        }
        break
      }
      case 'delete_node': {
        if (operation.nodeId) {
          const nodeToDelete = findNodeByReference(operation.nodeId)
          if (nodeToDelete) {
            deleteElements({ nodes: [nodeToDelete] })
          }
        }
        break
      }
      case 'add_edge': {
        if (operation.sourceId && operation.targetId) {
          const sourceNode = findNodeByReference(operation.sourceId)
          const targetNode = findNodeByReference(operation.targetId)
          
          if (sourceNode && targetNode) {
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
        if (operation.edgeId) {
          setEdges(edges.filter(e => e.id !== operation.edgeId))
        } else if (operation.sourceId && operation.targetId) {
          const sourceNode = findNodeByReference(operation.sourceId)
          const targetNode = findNodeByReference(operation.targetId)
          
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

  const applyFlowDiff = (flowDiff: FlowDiff) => {
    if (flowDiff.type === 'explain') {
      // For explain type, no flow changes needed - just the response message
      return
    } else if (flowDiff.type === 'multiple' && flowDiff.operations) {
      // For multiple operations, we need to batch the updates to avoid state conflicts
      console.log('Processing multiple operations:', flowDiff.operations)
      
      let currentNodes = getNodes()
      let currentEdges = getEdges()
      let hasNodeChanges = false
      let hasEdgeChanges = false
      
      // Process all operations and collect the changes
      flowDiff.operations.forEach((operation, index) => {
        console.log(`Processing operation ${index + 1}:`, operation)
        
        switch (operation.action) {
          case 'add_node': {
            const nodeLabel = operation.nodeLabel || 'New Node'
            const nodeType = operation.nodeType || 'action'
            const newNode = {
              id: generateNodeId(nodeType, nodeLabel),
              type: nodeType,
              position: operation.nodePosition || { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
              data: {
                label: nodeLabel
              }
            }
            console.log('Adding node to batch:', newNode)
            currentNodes = [...currentNodes, newNode]
            hasNodeChanges = true
            break
          }
          case 'update_node': {
            if (operation.nodeId && operation.updateData) {
              const nodeIndex = currentNodes.findIndex(n => 
                n.id === operation.nodeId || 
                n.data.label.toLowerCase() === operation.nodeId!.toLowerCase() ||
                n.data.label.toLowerCase().includes(operation.nodeId!.toLowerCase())
              )
              
              if (nodeIndex !== -1) {
                console.log(`Updating node at index ${nodeIndex} with:`, operation.updateData)
                currentNodes = currentNodes.map((node, idx) => {
                  if (idx === nodeIndex) {
                    const updatedNode = {
                      ...node,
                      type: operation.updateData?.type || node.type,
                      position: operation.updateData?.position || node.position,
                      data: {
                        ...node.data,
                        label: operation.updateData?.label || node.data.label
                      }
                    }
                    console.log('Node updated in batch:', updatedNode)
                    return updatedNode
                  }
                  return node
                })
                hasNodeChanges = true
              } else {
                console.log('Node not found for batch update:', operation.nodeId)
              }
            }
            break
          }
          case 'delete_node': {
            if (operation.nodeId) {
              const nodeToDelete = currentNodes.find(n => 
                n.id === operation.nodeId || 
                n.data.label.toLowerCase() === operation.nodeId!.toLowerCase() ||
                n.data.label.toLowerCase().includes(operation.nodeId!.toLowerCase())
              )
              if (nodeToDelete) {
                currentNodes = currentNodes.filter(n => n.id !== nodeToDelete.id)
                // Also remove associated edges
                currentEdges = currentEdges.filter(e => 
                  e.source !== nodeToDelete.id && e.target !== nodeToDelete.id
                )
                hasNodeChanges = true
                hasEdgeChanges = true
              }
            }
            break
          }
          case 'add_edge': {
            if (operation.sourceId && operation.targetId) {
              const sourceNode = currentNodes.find(n => 
                n.id === operation.sourceId || 
                n.data.label.toLowerCase() === operation.sourceId!.toLowerCase() ||
                n.data.label.toLowerCase().includes(operation.sourceId!.toLowerCase())
              )
              const targetNode = currentNodes.find(n => 
                n.id === operation.targetId || 
                n.data.label.toLowerCase() === operation.targetId!.toLowerCase() ||
                n.data.label.toLowerCase().includes(operation.targetId!.toLowerCase())
              )
              
              if (sourceNode && targetNode) {
                const existingEdge = currentEdges.find(e => 
                  e.source === sourceNode.id && e.target === targetNode.id
                )
                
                if (!existingEdge) {
                  const newEdge = {
                    id: `edge-${sourceNode.id}-${targetNode.id}`,
                    source: sourceNode.id,
                    target: targetNode.id,
                    type: 'custom'
                  }
                  currentEdges = [...currentEdges, newEdge]
                  hasEdgeChanges = true
                }
              }
            }
            break
          }
          case 'delete_edge': {
            if (operation.edgeId) {
              currentEdges = currentEdges.filter(e => e.id !== operation.edgeId)
              hasEdgeChanges = true
            } else if (operation.sourceId && operation.targetId) {
              const sourceNode = currentNodes.find(n => 
                n.id === operation.sourceId || 
                n.data.label.toLowerCase() === operation.sourceId!.toLowerCase()
              )
              const targetNode = currentNodes.find(n => 
                n.id === operation.targetId || 
                n.data.label.toLowerCase() === operation.targetId!.toLowerCase()
              )
              
              if (sourceNode && targetNode) {
                currentEdges = currentEdges.filter(e => 
                  !(e.source === sourceNode.id && e.target === targetNode.id)
                )
                hasEdgeChanges = true
              }
            }
            break
          }
          case 'clear_all': {
            currentNodes = []
            currentEdges = []
            hasNodeChanges = true
            hasEdgeChanges = true
            break
          }
        }
      })
      
      // Apply all the batched changes at once
      if (hasNodeChanges) {
        console.log('Applying batched node changes:', currentNodes)
        setNodes(currentNodes)
      }
      if (hasEdgeChanges) {
        console.log('Applying batched edge changes:', currentEdges)
        setEdges(currentEdges)
      }
    } else if (flowDiff.type === 'single' && flowDiff.operation) {
      // Apply single operation
      applyFlowOperation(flowDiff.operation)
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
      // Debug: Log the AI response for troubleshooting
      console.log('AI Response:', data)
      
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
        console.log('Applying flow diff:', data.flowDiff)
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
                              <span>&apos;Update node1 label to GPT-4&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Add CSV reader, GPT-4 model and connect them&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Delete the action node&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Explain what this flow does&apos;</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>&apos;Add 3 nodes and connect them in sequence&apos;</span>
                            </li>
                          </ul>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          💡 I can now update nodes, handle multiple operations, and provide detailed flow explanations!
                        </p>
                      </div>
                    </Card>
                  </div>
                )}
                
                <AnimatePresence>
                  {messages.map((message) => (
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
