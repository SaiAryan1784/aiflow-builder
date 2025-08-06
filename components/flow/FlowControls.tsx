"use client"

import React, { useState, useEffect } from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { motion } from 'framer-motion';
import domtoimage from 'dom-to-image-more';
import { 
  Undo2, 
  Redo2, 
  Save,
  FolderOpen,
  Trash2,
  Camera
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
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
import { Card } from '../ui/card';
import useFlowStore from '../../store/useFlowStore';

export default function FlowControls() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    saveFlow,
    loadFlow,
    deleteFlow,
    getSavedFlows,
    reset
  } = useFlowStore();

  const { toObject } = useReactFlow();

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [savedFlows, setSavedFlows] = useState(getSavedFlows());

  // Refresh saved flows when dialogs open
  useEffect(() => {
    if (isLoadDialogOpen) {
      setSavedFlows(getSavedFlows());
    }
  }, [isLoadDialogOpen, getSavedFlows]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          if (canUndo()) {
            undo();
          }
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          if (canRedo()) {
            redo();
          }
        } else if (event.key === 's') {
          event.preventDefault();
          setIsSaveDialogOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleSaveFlow = () => {
    if (flowName.trim()) {
      saveFlow(flowName.trim());
      setFlowName('');
      setIsSaveDialogOpen(false);
    }
  };

  const handleLoadFlow = () => {
    if (selectedFlowId) {
      loadFlow(selectedFlowId);
      setSelectedFlowId('');
      setIsLoadDialogOpen(false);
    }
  };

  const handleDeleteFlow = (flowId: string) => {
    deleteFlow(flowId);
    setSavedFlows(getSavedFlows());
    if (selectedFlowId === flowId) {
      setSelectedFlowId('');
    }
  };

  const handleScreenshot = async () => {
    try {
      // Get the React Flow viewport element (the actual canvas area)
      const reactFlowViewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
      
      if (!reactFlowViewport || !reactFlowWrapper) {
        throw new Error('Could not find React Flow elements');
      }

      // Detect current theme
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        document.body.classList.contains('dark');
      
      const backgroundColor = isDarkMode ? '#0a0a0a' : '#ffffff';

      // Use dom-to-image-more which handles CSS issues better
      const dataUrl = await domtoimage.toPng(reactFlowWrapper, {
        quality: 1,
        bgcolor: backgroundColor,
        width: reactFlowWrapper.offsetWidth,
        height: reactFlowWrapper.offsetHeight,
        style: {
          backgroundColor: backgroundColor,
          border: 'none !important',
          outline: 'none !important',
          boxShadow: 'none !important',
          borderRadius: '0px !important',
        },
        filter: (node: Node) => {
          // Skip problematic elements and borders
          if (node instanceof Element) {
            const classList = node.classList;
            const tagName = node.tagName.toLowerCase();
            
            // Skip these elements to remove borders and UI elements
            return !classList.contains('react-flow__controls') &&
                   !classList.contains('react-flow__minimap') &&
                   !classList.contains('react-flow__attribution') &&
                   !classList.contains('react-flow__panel') &&
                   !classList.contains('react-flow__renderer') &&
                   !classList.contains('react-flow__background') &&
                   tagName !== 'style' &&
                   tagName !== 'script' &&
                   // Don't filter out the viewport or nodes/edges
                   (classList.contains('react-flow__viewport') ||
                    classList.contains('react-flow__node') ||
                    classList.contains('react-flow__edge') ||
                    node.closest('.react-flow__viewport') !== null ||
                    // Skip any element with border or outline styles
                    (!node.getAttribute('style')?.includes('border') &&
                     !node.getAttribute('style')?.includes('outline')));
          }
          return true;
        },
      });

      // Convert data URL to blob and download
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-flow-${isDarkMode ? 'dark' : 'light'}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Screenshot failed:', error);
      handleScreenshotFallback();
    }
  };

  const handleScreenshotFallback = () => {
    try {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = 1200;
      canvas.height = 800;

      // Set theme-appropriate background
      ctx.fillStyle = isDarkMode ? '#0a0a0a' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add title
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.fillText('AI Flow Builder', 30, 50);
      
      // Add metadata
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = isDarkMode ? '#a1a1aa' : '#71717a';
      ctx.fillText(`Generated: ${new Date().toLocaleString()}`, 30, 80);
      ctx.fillText(`Theme: ${isDarkMode ? 'Dark' : 'Light'} Mode`, 30, 105);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `flow-fallback-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch {
      // Final fallback: export as JSON
      const flowData = toObject();
      const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Panel position="bottom-center" className="mb-4">
      <TooltipProvider>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 flex items-center gap-2"
          style={{
            transform: 'translateX(-50%)',
            left: '50%',
            position: 'relative'
          }}
        >
          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={undo}
                disabled={!canUndo()}
                className="transition-all hover:scale-110"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={redo}
                disabled={!canRedo()}
                className="transition-all hover:scale-110"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Save Flow */}
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="transition-all hover:scale-110"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Flow (Ctrl+S)</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Flow</DialogTitle>
                <DialogDescription>
                  Give your flow a name to save it for later use.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="flow-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="flow-name"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter flow name"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveFlow()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFlow} disabled={!flowName.trim()}>
                  Save Flow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Load Flow */}
          <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="transition-all hover:scale-110"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Load Flow</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Load Flow</DialogTitle>
                <DialogDescription>
                  Select a saved flow to load.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {savedFlows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No saved flows found.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedFlows.map((flow) => (
                      <Card
                        key={flow.id}
                        className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedFlowId === flow.id ? 'bg-muted border-primary' : ''
                        }`}
                        onClick={() => setSelectedFlowId(flow.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{flow.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(flow.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFlow(flow.id);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleLoadFlow} 
                  disabled={!selectedFlowId}
                >
                  Load Flow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Screenshot */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleScreenshot}
                className="transition-all hover:scale-110"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Take Screenshot</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Clear All */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                className="transition-all hover:scale-110 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear All</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>
      </TooltipProvider>
    </Panel>
  );
}
