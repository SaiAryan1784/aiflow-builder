"use client"

import React, { useState } from 'react';
import { Node, useReactFlow, Panel } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Link,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface FlowToolbarProps {
  readonly isPanelOpen?: boolean;
}

export default function FlowToolbar({ isPanelOpen = false }: FlowToolbarProps) {
  const { getNodes, addNodes, setNodes, setEdges, deleteElements } = useReactFlow();
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [newNodeData, setNewNodeData] = useState({
    label: '',
    type: 'action'
  });

  const handleAddNode = () => {
    const position = {
      x: Math.random() * 500 + 100,
      y: Math.random() * 300 + 100,
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: newNodeData.type,
      position,
      data: {
        label: newNodeData.label || 'New Node'
      },
    };

    addNodes(newNode);
    setIsAddNodeOpen(false);
    setNewNodeData({ label: '', type: 'action' });

    // Animate the new node
    setTimeout(() => {
      const nodes = getNodes();
      const updatedNodes = nodes.map(node => 
        node.id === newNode.id 
          ? { ...node, style: { ...node.style, transition: 'all 0.3s ease' } }
          : node
      );
      setNodes(updatedNodes);
    }, 100);
  };

  const handleDeleteSelected = () => {
    if (selectedElements.length > 0) {
      deleteElements({ nodes: selectedElements.map(id => ({ id })), edges: [] });
      setSelectedElements([]);
    }
  };

  const handleClearAll = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <Panel position="bottom-center" className="mb-4 ">
      <TooltipProvider>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 flex items-center gap-2"
          style={{
            marginRight: isPanelOpen ? '320px' : '0px',
            transition: 'margin-right 0.3s ease-in-out'
          }}
        >
          {/* Add Node Dialog */}
          <Dialog open={isAddNodeOpen} onOpenChange={setIsAddNodeOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="transition-all hover:scale-110"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Node</DialogTitle>
                <DialogDescription>
                  Create a new node for your flow
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    value={newNodeData.type} 
                    onValueChange={(value) => setNewNodeData({...newNodeData, type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select node type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="action">Universal Node</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-label" className="text-right">
                    Label
                  </Label>
                  <Input
                    id="node-label"
                    value={newNodeData.label}
                    onChange={(e) => setNewNodeData({...newNodeData, label: e.target.value})}
                    className="col-span-3"
                    placeholder="Enter node label"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddNodeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNode}>
                  Add Node
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isConnecting ? "default" : "outline"}
                size="icon"
                onClick={() => setIsConnecting(!isConnecting)}
                className="transition-all hover:scale-110"
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isConnecting ? 'Exit Connect Mode' : 'Connect Nodes'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Edit Selected */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="transition-all hover:scale-110"
                disabled={selectedElements.length === 0}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Selected</p>
            </TooltipContent>
          </Tooltip>

          {/* Delete Selected */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDeleteSelected}
                disabled={selectedElements.length === 0}
                className="transition-all hover:scale-110 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Selected</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleClearAll} className="text-destructive">
                <X className="mr-2 h-4 w-4" />
                Clear All
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Save className="mr-2 h-4 w-4" />
                Save Flow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </TooltipProvider>
    </Panel>
  );
}
