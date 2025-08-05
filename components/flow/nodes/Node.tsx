import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Edit3, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type NodeData = {
  label: string;
};

const Node = memo(({ id, data, selected }: NodeProps<NodeData>) => {
  const { setNodes, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);

  const handleEdit = () => {
    setIsEditing(true);
    setEditLabel(data.label);
  };

  const handleSave = () => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: editLabel } }
          : node
      )
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(data.label);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className={`
        min-w-[120px] rounded-lg border-2 bg-background shadow-md transition-all group
        ${selected ? 'border-primary shadow-lg' : 'border-border'}
        hover:shadow-lg
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground"
      />
      
      <div className="p-3 relative">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={handleKeyPress}
              className="text-sm h-6 px-2 bg-background text-foreground border-border"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground text-center flex-1">
              {data.label}
            </p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive/80 hover:bg-muted"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground"
      />
    </div>
  );
});

Node.displayName = 'Node';

export default Node;
