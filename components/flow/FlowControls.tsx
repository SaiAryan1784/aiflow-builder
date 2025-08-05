"use client"

import React, { useState, useEffect } from 'react';
import { Panel } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Undo2, 
  Redo2, 
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2
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
    exportFlow,
    importFlow,
    reset
  } = useFlowStore();

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [importData, setImportData] = useState('');
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

  const handleExportFlow = () => {
    const flowData = exportFlow();
    const blob = new Blob([flowData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFlow = () => {
    if (importData.trim()) {
      const success = importFlow(importData.trim());
      if (success) {
        setImportData('');
        setIsImportDialogOpen(false);
      } else {
        alert('Invalid flow data. Please check the format and try again.');
      }
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setImportData(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Panel position="bottom-center" className="mb-4" style={{ zIndex: 1000 }}>
      <TooltipProvider>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 flex items-center gap-2"
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
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="transition-all hover:scale-110"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Flow (Ctrl+S)</p>
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
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
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="transition-all hover:scale-110"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Load Flow</p>
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
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

          {/* Export Flow */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportFlow}
                className="transition-all hover:scale-110"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Flow</p>
            </TooltipContent>
          </Tooltip>

          {/* Import Flow */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="transition-all hover:scale-110"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import Flow</p>
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Flow</DialogTitle>
                <DialogDescription>
                  Import a flow from a JSON file or paste the data directly.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file-import">Import from file</Label>
                  <Input
                    id="file-import"
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-data">Or paste flow data</Label>
                  <textarea
                    id="import-data"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full h-32 p-2 text-sm border rounded-md resize-none"
                    placeholder="Paste your flow JSON data here..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImportFlow} disabled={!importData.trim()}>
                  Import Flow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
