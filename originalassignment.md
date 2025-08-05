# AI-Powered Flow Builder

Build a **basic flow authoring tool** with an **AI assistant panel** to add, update, and delete flow nodes.

## ✅ What You’ll Build

A web app where users can:

- Design simple flow diagrams (like call center or chatbot flows)
- Add/edit/delete nodes
- Connect nodes with arrows
- Use a built-in **AI assistant panel** to modify the flow with natural language prompts

## 🔧 Core Features

### 1. **Flow Canvas**

- Use [React Flow](https://reactflow.dev/) to display an interactive canvas
- Support dragging and connecting nodes
- Zoom/pan functionality

### 2. **Connection Management**

- Click-and-drag to connect nodes
- Delete connections/nodes

### 3. **Node Management (optional)**

- UI buttons to:
    - Add new nodes
    - Delete nodes
    - Edit node content

### 4. **AI Sidebar Panel (Mandatory)**

- A sidebar where the user can type prompts like:
    - “Add a conversation node that says ‘Hello’”
    - “Delete the end call node”
    - “Connect node 1 to node 2”
    - “Explain me what this flow does” (Questions also)
- Your AI assistant should interpret and apply the command
- Use API from any LLM provider you want.

🧠 *Hint: Convert natural text → structured command → apply on React Flow state*

## ✨ Optional Features (Bonus)

Choose any 1-2 only **if time permits**:

- Save/load flow to `localStorage`
- Visually improved styling
- Undo/redo
