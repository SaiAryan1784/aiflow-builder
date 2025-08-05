import { create } from 'zustand'
import { Node } from 'reactflow'

interface FlowActionsStore {
  addNodeFunction: (() => void) | null
  setAddNodeFunction: (fn: () => void) => void
  triggerAddNode: () => void
}

export const useFlowActions = create<FlowActionsStore>((set, get) => ({
  addNodeFunction: null,
  setAddNodeFunction: (fn: () => void) => set({ addNodeFunction: fn }),
  triggerAddNode: () => {
    const { addNodeFunction } = get()
    if (addNodeFunction) {
      addNodeFunction()
    }
  },
}))
