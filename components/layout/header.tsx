"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sparkles, Plus, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import useFlowStore from "../../store/useFlowStore"

export function Header() {
  const { addNode } = useFlowStore();
  
  const handleCreateNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'action' as const,
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100
      },
      data: {
        label: 'New Node'
      }
    };
    addNode(newNode);
  };
  return (
    <header className="top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="mr-6 flex">
          <Link className="flex items-center space-x-3" href="/">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="hidden font-bold text-lg sm:inline-block">
              AI Flow Builder
            </span>
          </Link>
        </div>
        
        {/* Center section with Create Node button */}
        <div className="flex-1 flex justify-center">
          <Button
            onClick={handleCreateNode}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Node
          </Button>
        </div>
        
        <div className="flex items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {/* Info Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="mr-2 hover:bg-muted transition-colors"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Flow Builder Features
                  </DialogTitle>
                  <DialogDescription>
                    Discover all the powerful features available to create amazing flows with AI assistance.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Visual Flow Editor Section */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      🎨 Visual Flow Editor
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• <strong>Drag & Drop:</strong> Click and drag nodes around the canvas</p>
                      <p>• <strong>Connect Nodes:</strong> Drag from node handles to create connections</p>
                      <p>• <strong>Edit Labels:</strong> Click on any node to edit its label inline</p>
                      <p>• <strong>Zoom & Pan:</strong> Use mouse wheel to zoom, drag canvas to pan</p>
                      <p>• <strong>Select & Delete:</strong> Click nodes/edges and press Delete key</p>
                    </div>
                  </Card>

                  <Separator />

                  {/* AI Assistant Section */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      🤖 AI Assistant Panel
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• <strong>Natural Language:</strong> Use plain English to modify your flow</p>
                      <p>• <strong>Add Nodes:</strong> &ldquo;Add a new action node called &lsquo;Process Data&rsquo;&rdquo;</p>
                      <p>• <strong>Connect Nodes:</strong> &ldquo;Connect the input node to the process node&rdquo;</p>
                      <p>• <strong>Update Labels:</strong> &ldquo;Change the node label to &lsquo;User Authentication&rsquo;&rdquo;</p>
                      <p>• <strong>Delete Items:</strong> &ldquo;Remove the connection between A and B&rdquo;</p>
                      <p>• <strong>Smart Suggestions:</strong> AI understands your flow context</p>
                    </div>
                  </Card>

                  <Separator />

                  {/* Flow Management Section */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      💾 Flow Management
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• <strong>Save Flows:</strong> Ctrl+S to save your current flow</p>
                      <p>• <strong>Load Flows:</strong> Access saved flows from the toolbar</p>
                      <p>• <strong>Undo/Redo:</strong> Ctrl+Z to undo, Ctrl+Y to redo changes</p>
                      <p>• <strong>Auto-save:</strong> Your work is automatically preserved</p>
                      <p>• <strong>Screenshot:</strong> Capture and share your flow as an image</p>
                      <p>• <strong>Clear All:</strong> Start fresh with the clear button</p>
                    </div>
                  </Card>

                  <Separator />

                  {/* Keyboard Shortcuts Section */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      ⌨️ Keyboard Shortcuts
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>• <strong>Ctrl+Z:</strong> Undo</p>
                      <p>• <strong>Ctrl+Y:</strong> Redo</p>
                      <p>• <strong>Ctrl+S:</strong> Save Flow</p>
                      <p>• <strong>Delete:</strong> Remove selected</p>
                      <p>• <strong>Escape:</strong> Deselect all</p>
                      <p>• <strong>Mouse Wheel:</strong> Zoom</p>
                    </div>
                  </Card>

                  <Separator />

                  {/* Tips Section */}
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      💡 Pro Tips
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Use the <strong>Create Node</strong> button in the header for quick node creation</p>
                      <p>• The AI assistant remembers your flow context for better suggestions</p>
                      <p>• Try natural language like &ldquo;organize my nodes in a grid layout&rdquo;</p>
                      <p>• Use the minimap in the bottom-right for easy navigation</p>
                      <p>• Dark/light theme toggle is available in the top-right corner</p>
                    </div>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="mx-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
