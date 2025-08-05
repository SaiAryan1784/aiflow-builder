import { create } from 'zustand';
import { Edge, Node, Connection } from 'reactflow';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (connection: Connection | Edge) => void;
  reset: () => void;
}

const useFlowStore = create<FlowState>()(
  devtools(
    persist(
      (set) => ({
        nodes: [],
        edges: [],
        setNodes: (nodes) => set({ nodes }),
        setEdges: (edges) => set({ edges }),
        addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
        addEdge: (connection) => set((state) => ({ edges: [...state.edges, connection] })),
        reset: () => set({ nodes: [], edges: [] }),
      }),
      {
        name: 'flow-storage',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);

export default useFlowStore;
