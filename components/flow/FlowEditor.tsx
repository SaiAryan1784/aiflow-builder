"use client"

import React from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Node as SimpleNode } from './nodes';
import { CustomEdge } from './edges';
import { AIAssistantPanel } from '../layout/ai-assistant-panel';
import { useFlowActions } from '../../hooks/useFlowActions';

// Define node types
const nodeTypes = {
  action: SimpleNode,
};

// Define edge types
const edgeTypes = {
  custom: CustomEdge,
};

// Example initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'action',
    data: {
      label: 'Node 1',
    },
    position: { x: 200, y: 150 },
  },
  {
    id: '2',
    type: 'action',
    data: {
      label: 'Node 2',
    },
    position: { x: 400, y: 150 },
  },
];

const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  const { setAddNodeFunction } = useFlowActions();

  const onConnect = (params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds));
  };

  const addNewNode = React.useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'action',
      data: {
        label: `Node ${nodes.length + 1}`,
      },
      position: { 
        x: Math.random() * 500 + 100, 
        y: Math.random() * 300 + 100 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  // Register the addNode function with the global store
  React.useEffect(() => {
    setAddNodeFunction(addNewNode);
  }, [addNewNode, setAddNodeFunction]);

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
