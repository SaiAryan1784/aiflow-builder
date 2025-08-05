# AI Flow Builder

A powerful, AI-assisted visual flow authoring tool built with Next.js 15, React Flow, and LangChain. Design interactive flow diagrams with natural language AI assistance for creating, modifying, and managing nodes and connections.

![AI Flow Builder](https://img.shields.io/badge/AI-Flow%20Builder-blue?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)

## ✨ Features

### 🎨 Visual Flow Editor
- **Interactive Canvas**: Drag, drop, and connect nodes with an intuitive interface
- **Real-time Editing**: Edit node labels inline with immediate updates
- **Multiple Node Types**: Support for Action, AI Model, and Data Source nodes
- **Custom Edges**: Beautiful custom edge styling and animations
- **Zoom & Pan**: Full canvas navigation with minimap support

### 🤖 AI Assistant Panel
- **Natural Language Commands**: Modify flows using plain English
- **Smart Node Management**: Add, update, delete, and connect nodes via AI
- **Context-Aware**: Understands current flow state for intelligent suggestions
- **Powered by Groq**: Fast LLM responses using LangChain integration

### 💾 State Management
- **Persistent Storage**: Automatic saving with local storage persistence
- **Undo/Redo**: Full history tracking with 50-step undo support
- **Flow Save/Load**: Save multiple flow configurations
- **Export/Import**: JSON-based flow sharing and backup

### 🎯 Modern UI/UX
- **Dark/Light Theme**: Seamless theme switching
- **Responsive Design**: Works across desktop and mobile devices
- **Accessible Components**: Built with Radix UI primitives
- **Smooth Animations**: Framer Motion powered transitions

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: App Router with Server Actions
- **React 19**: Latest React features and performance improvements
- **TypeScript 5**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful, accessible component library
- **Radix UI**: Headless UI primitives

### Flow Engine
- **React Flow 11**: Professional flow diagram library
- **Zustand**: Lightweight state management
- **Framer Motion**: Smooth animations and transitions

### AI Integration
- **LangChain**: AI orchestration framework
- **Groq**: High-performance LLM inference
- **Zod**: Schema validation for AI responses

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aiflow-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Basic Flow Creation

1. **Add Nodes**: Use the AI assistant panel to add nodes:
   ```
   "Add a data source node called 'User Input'"
   "Create an AI model node for processing"
   "Add an action node named 'Send Email'"
   ```

2. **Connect Nodes**: Either drag connections manually or use AI:
   ```
   "Connect User Input to AI Model"
   "Link the AI Model to Send Email action"
   ```

3. **Edit Nodes**: Click on any node to edit its label inline, or use AI:
   ```
   "Change the User Input node to 'Customer Data'"
   "Update the action node label to 'Generate Report'"
   ```

### AI Assistant Commands

The AI assistant understands various natural language commands:

- **Creating**: "Add a new action node", "Create a data source"
- **Connecting**: "Connect node A to node B", "Link these nodes"
- **Updating**: "Change the label to X", "Rename this node"
- **Deleting**: "Remove this node", "Delete the connection"
- **Layout**: "Organize the nodes", "Arrange horizontally"

### Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + S`: Save flow
- `Delete`: Delete selected nodes/edges
- `Escape`: Deselect all

## 🏗️ Project Structure

```
aiflow-builder/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── flow/             # Flow-related components
│   │   ├── FlowEditor.tsx # Main flow canvas
│   │   ├── FlowControls.tsx # Flow controls
│   │   ├── nodes/        # Node components
│   │   └── edges/        # Edge components
│   ├── layout/           # Layout components
│   │   ├── ai-assistant-panel.tsx
│   │   └── header.tsx
│   └── ui/               # shadcn/ui components
├── store/                # Zustand stores
│   └── useFlowStore.ts   # Flow state management
├── lib/                  # Utilities
│   └── utils.ts
└── hooks/                # Custom React hooks
```

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS v4 with custom configuration in `postcss.config.mjs`.

### ESLint
ESLint is configured with Next.js recommended rules in `eslint.config.mjs`.

### TypeScript
TypeScript configuration is in `tsconfig.json` with strict mode enabled.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Docker
```bash
# Build the image
docker build -t aiflow-builder .

# Run the container
docker run -p 3000:3000 aiflow-builder
```

### Manual Deployment
```bash
# Build the project
npm run build

# Start the production server
npm start
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure components are accessible

## 📝 API Reference

### Flow Store Actions

```typescript
// Node management
addNode(node: Node): void
updateNode(nodeId: string, updates: Partial<Node>): void
deleteNode(nodeId: string): void

// Edge management
addEdge(connection: Connection | Edge): void
deleteEdge(edgeId: string): void

// History management
undo(): void
redo(): void
pushToHistory(): void

// Persistence
saveFlow(name: string): string
loadFlow(flowId: string): boolean
```

### AI Assistant Integration

The AI assistant processes natural language commands and returns structured operations:

```typescript
interface FlowOperation {
  action: string
  nodeId?: string
  nodeType?: 'dataSource' | 'aiModel' | 'action'
  nodeLabel?: string
  nodePosition?: { x: number; y: number }
  sourceId?: string
  targetId?: string
}
```

## 🔍 Troubleshooting

### Common Issues

**Build Errors**
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Verify TypeScript configuration

**AI Assistant Not Working**
- Check Groq API key configuration
- Verify environment variables are set
- Check network connectivity

**Performance Issues**
- Enable React Strict Mode for development
- Use React DevTools for debugging
- Check for memory leaks in large flows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the excellent flow diagram library
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component system
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [LangChain](https://langchain.com/) for AI orchestration
- [Groq](https://groq.com/) for fast LLM inference

---

Made with ❤️ by the AI Flow Builder team
