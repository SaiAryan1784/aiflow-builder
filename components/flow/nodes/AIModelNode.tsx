import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

export type AIModelNodeData = {
  label: string;
};

const AIModelNode = memo(({ data, selected, id }: NodeProps<AIModelNodeData>) => {
  const { setNodes, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleSave = () => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label } } : node
      )
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        min-w-[120px] rounded-lg border-2 bg-background shadow-md transition-all group relative
        ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-300 dark:border-purple-600'}
        ring-1 ring-purple-200 dark:ring-purple-800
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500"
      />
      
      <div className="p-3">
        {isEditing ? (
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyPress}
            className="text-sm font-medium text-foreground text-center border-0 p-0 h-auto bg-transparent focus:ring-0 focus:outline-none"
            autoFocus
          />
        ) : (
          <p className="text-sm font-medium text-foreground text-center">{data.label}</p>
        )}
      </div>

      {/* Edit and Delete buttons - show on hover */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0 bg-background border-border hover:bg-muted"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline" 
          className="h-6 w-6 p-0 bg-background border-border hover:bg-muted"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500"
      />
    </div>
  );
});

AIModelNode.displayName = 'AIModelNode';

export default AIModelNode;
