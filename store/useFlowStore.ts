import { create } from 'zustand';
import { Edge, Node, Connection } from 'reactflow';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

interface FlowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface SavedFlow {
  id: string;
  name: string;
  snapshot: FlowSnapshot;
  timestamp: number;
}

interface FlowState {
  // Current state
  nodes: Node[];
  edges: Edge[];
  
  // History for undo/redo
  history: FlowSnapshot[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Saved flows
  savedFlows: SavedFlow[];
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (connection: Connection | Edge) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  reset: () => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToHistory: (snapshot?: FlowSnapshot) => void;
  
  // Save/Load actions
  saveFlow: (name: string) => string;
  loadFlow: (flowId: string) => boolean;
  deleteFlow: (flowId: string) => void;
  getSavedFlows: () => SavedFlow[];
  exportFlow: () => string;
  importFlow: (flowData: string) => boolean;
}

const createSnapshot = (nodes: Node[], edges: Edge[]): FlowSnapshot => ({
  nodes: JSON.parse(JSON.stringify(nodes)),
  edges: JSON.parse(JSON.stringify(edges))
});

const useFlowStore = create<FlowState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        nodes: [],
        edges: [],
        history: [],
        historyIndex: -1,
        maxHistorySize: 50,
        savedFlows: [],
        
        // Basic actions
        setNodes: (nodes) => {
          const { pushToHistory } = get();
          pushToHistory();
          set({ nodes });
        },
        
        setEdges: (edges) => {
          const { pushToHistory } = get();
          pushToHistory();
          set({ edges });
        },
        
        addNode: (node) => {
          const { nodes, pushToHistory } = get();
          pushToHistory();
          // Ensure all nodes are type 'action' for universal nodes
          const universalNode = { ...node, type: 'action' };
          set({ nodes: [...nodes, universalNode] });
        },
        
        addEdge: (connection) => {
          const { edges, pushToHistory } = get();
          pushToHistory();
          const newEdge = typeof connection === 'object' && 'id' in connection 
            ? connection
            : { 
                id: `edge-${connection.source}-${connection.target}`,
                source: connection.source!,
                target: connection.target!,
                type: 'custom'
              };
          set({ edges: [...edges, newEdge] });
        },
        
        updateNode: (nodeId, updates) => {
          const { nodes, pushToHistory } = get();
          pushToHistory();
          const updatedNodes = nodes.map(node => 
            node.id === nodeId ? { ...node, ...updates } : node
          );
          set({ nodes: updatedNodes });
        },
        
        deleteNode: (nodeId) => {
          const { nodes, edges, pushToHistory } = get();
          pushToHistory();
          const filteredNodes = nodes.filter(node => node.id !== nodeId);
          const filteredEdges = edges.filter(edge => 
            edge.source !== nodeId && edge.target !== nodeId
          );
          set({ nodes: filteredNodes, edges: filteredEdges });
        },
        
        deleteEdge: (edgeId) => {
          const { edges, pushToHistory } = get();
          pushToHistory();
          const filteredEdges = edges.filter(edge => edge.id !== edgeId);
          set({ edges: filteredEdges });
        },
        
        reset: () => {
          const { pushToHistory } = get();
          pushToHistory();
          set({ nodes: [], edges: [] });
        },
        
        // History actions
        pushToHistory: (snapshot) => {
          const { nodes, edges, history, historyIndex, maxHistorySize } = get();
          const currentSnapshot = snapshot || createSnapshot(nodes, edges);
          
          // Don't add if it's the same as the current snapshot
          if (history.length > 0 && historyIndex >= 0) {
            const lastSnapshot = history[historyIndex];
            if (JSON.stringify(lastSnapshot) === JSON.stringify(currentSnapshot)) {
              return;
            }
          }
          
          // Remove any history after current index (when we're in the middle of history)
          const newHistory = history.slice(0, historyIndex + 1);
          
          // Add new snapshot
          newHistory.push(currentSnapshot);
          
          // Limit history size
          if (newHistory.length > maxHistorySize) {
            newHistory.shift();
          } else {
            set({ historyIndex: historyIndex + 1 });
          }
          
          set({ 
            history: newHistory,
            historyIndex: newHistory.length - 1
          });
        },
        
        undo: () => {
          const { history, historyIndex } = get();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const snapshot = history[newIndex];
            set({ 
              nodes: snapshot.nodes,
              edges: snapshot.edges,
              historyIndex: newIndex
            });
          }
        },
        
        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const snapshot = history[newIndex];
            set({ 
              nodes: snapshot.nodes,
              edges: snapshot.edges,
              historyIndex: newIndex
            });
          }
        },
        
        canUndo: () => {
          const { historyIndex } = get();
          return historyIndex > 0;
        },
        
        canRedo: () => {
          const { history, historyIndex } = get();
          return historyIndex < history.length - 1;
        },
        
        // Save/Load actions
        saveFlow: (name) => {
          const { nodes, edges, savedFlows } = get();
          const flowId = `flow-${Date.now()}`;
          const newFlow: SavedFlow = {
            id: flowId,
            name,
            snapshot: createSnapshot(nodes, edges),
            timestamp: Date.now()
          };
          set({ savedFlows: [...savedFlows, newFlow] });
          return flowId;
        },
        
        loadFlow: (flowId) => {
          const { savedFlows, pushToHistory } = get();
          const flow = savedFlows.find(f => f.id === flowId);
          if (flow) {
            pushToHistory();
            set({ 
              nodes: flow.snapshot.nodes,
              edges: flow.snapshot.edges
            });
            return true;
          }
          return false;
        },
        
        deleteFlow: (flowId) => {
          const { savedFlows } = get();
          const filteredFlows = savedFlows.filter(f => f.id !== flowId);
          set({ savedFlows: filteredFlows });
        },
        
        getSavedFlows: () => {
          const { savedFlows } = get();
          return [...savedFlows].sort((a, b) => b.timestamp - a.timestamp);
        },
        
        exportFlow: () => {
          const { nodes, edges } = get();
          const flowData = {
            nodes,
            edges,
            exportedAt: Date.now(),
            version: '1.0'
          };
          return JSON.stringify(flowData, null, 2);
        },
        
        importFlow: (flowData) => {
          try {
            const parsed = JSON.parse(flowData);
            if (parsed.nodes && parsed.edges && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
              const { pushToHistory } = get();
              pushToHistory();
              set({ 
                nodes: parsed.nodes,
                edges: parsed.edges
              });
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }
      }),
      {
        name: 'flow-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
          savedFlows: state.savedFlows,
          // Don't persist history to avoid localStorage bloat
        }),
      }
    )
  )
);

export default useFlowStore;
