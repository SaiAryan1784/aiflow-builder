# Flow Editor Components

## Overview

The Flow Editor is built using React Flow v11 and provides a professional canvas for building AI workflows.

## Features Implemented

### Core Functionality
- ✅ **React Flow v11 Integration** - Full canvas with zoom, pan, and fit-to-view capabilities
- ✅ **MiniMap** - Overview of the entire flow for easy navigation
- ✅ **Controls** - Zoom in/out, fit view, and interactive mode toggle
- ✅ **Background** - Dotted pattern that adapts to light/dark theme

### Custom Node Types

1. **AI Model Node** (`AIModelNode`)
   - Icon: Brain icon
   - Color: Primary theme color
   - Features: Model name, description display
   - Handles: Top (input) and Bottom (output)

2. **Data Source Node** (`DataSourceNode`)
   - Icon: Database icon
   - Color: Blue
   - Features: Source type, connection status indicator
   - Handles: Bottom (output) only

3. **Action Node** (`ActionNode`)
   - Icon: Zap icon
   - Color: Orange
   - Features: Action type, parameter count display
   - Handles: Top (input) and Bottom (output)

### Custom Edge Type
- **CustomEdge** - Styled bezier curve with primary color
- Interactive button in the middle for potential edge actions

### Styling
- Fully integrated with the application's theme system
- Supports light/dark mode
- Professional UI with smooth transitions
- Consistent color scheme across all components

## Usage

The main flow editor is integrated into the app through:

```tsx
import FlowEditor from '@/components/flow/FlowEditor';

// In your component
<FlowEditor />
```

## File Structure

```
components/flow/
├── FlowEditor.tsx        # Main flow editor component
├── nodes/
│   ├── index.ts         # Barrel export for nodes
│   ├── AIModelNode.tsx  # AI model node component
│   ├── DataSourceNode.tsx # Data source node component
│   └── ActionNode.tsx   # Action node component
├── edges/
│   ├── index.ts         # Barrel export for edges
│   └── CustomEdge.tsx   # Custom edge component
└── README.md           # This file
```

## Customization

All nodes and edges can be customized by modifying their respective components. The theme integration ensures that any changes to the global theme will automatically be reflected in the flow editor.
