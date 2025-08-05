"use client"

import React from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Connection,
  Edge,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Node as SimpleNode } from './nodes';
import { CustomEdge } from './edges';
import { AIAssistantPanel } from '../layout/ai-assistant-panel';
import FlowControls from './FlowControls';
import useFlowStore from '../../store/useFlowStore';

// Define node types
const nodeTypes = {
  action: SimpleNode,
};

// Define edge types
const edgeTypes = {
  custom: CustomEdge,
};

function FlowCanvas() {
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    addEdge: storeAddEdge,
    pushToHistory
  } = useFlowStore();
  
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);

  // Handle node changes
  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
    // Check if any change ends dragging to push to history
    const dragEndChange = changes.find(change => 
      change.type === 'position' && !change.dragging
    );
    
    if (dragEndChange) {
      pushToHistory();
    }

    // Apply changes to nodes
    const updatedNodes = applyNodeChanges(changes, nodes);
    setNodes(updatedNodes);
  }, [nodes, setNodes, pushToHistory]);

  // Handle edge changes
  const onEdgesChange = React.useCallback((changes: EdgeChange[]) => {
    // Check if any change is a removal to push to history
    const hasRemoval = changes.some(change => change.type === 'remove');
    
    if (hasRemoval) {
      pushToHistory();
    }

    // Apply changes to edges
    const updatedEdges = applyEdgeChanges(changes, edges);
    setEdges(updatedEdges);
  }, [edges, setEdges, pushToHistory]);

  const onConnect = React.useCallback((params: Connection | Edge) => {
    const newEdge = {
      ...params,
      id: `edge-${params.source}-${params.target}`,
      type: 'custom'
    } as Edge;
    storeAddEdge(newEdge);
  }, [storeAddEdge]);

  const proOptions = { hideAttribution: true };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={proOptions}
          defaultEdgeOptions={{
            type: 'custom',
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
            className="bg-background"
          />
          
          <Controls
            className="bg-background border-border"
            showInteractive={false}
            position="bottom-left"
            style={{ 
              bottom: '20px',
              left: '20px'
            }}
          />
          
          <MiniMap
            className="bg-background border-border"
            style={{
              bottom: '20px',
              right: isPanelOpen ? '340px' : '20px',
              transition: 'right 0.3s ease-in-out'
            }}
            nodeColor={(node) => {
              switch (node.type) {
                case 'aiModel':
                  return 'hsl(var(--primary))';
                case 'dataSource':
                  return 'rgb(59, 130, 246)';
                case 'action':
                  return 'rgb(249, 115, 22)';
                default:
                  return 'hsl(var(--muted))';
              }
            }}
          />
          
          <Panel position="top-left" className="bg-background/80 backdrop-blur-sm p-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">AI Flow Builder</div>
            </div>
          </Panel>
          
          <FlowControls />
        </ReactFlow>
      </div>
      <AIAssistantPanel isOpen={isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)} />
    </div>
  );
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
