import React, { useState, useCallback } from 'react';

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isDirectory?: boolean;
  path?: string;
  metadata?: Record<string, any>;
}

export interface TreeViewProps {
  data: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
  onNodeDoubleClick?: (node: TreeNode) => void;
  onNodeRightClick?: (node: TreeNode, event: React.MouseEvent) => void;
  selectedNodeId?: string;
  expandedNodeIds?: Set<string>;
  onToggleExpand?: (nodeId: string) => void;
  showIcons?: boolean;
  indent?: number;
  className?: string;
}

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  onNodeClick,
  onNodeDoubleClick,
  onNodeRightClick,
  selectedNodeId,
  expandedNodeIds = new Set(),
  onToggleExpand,
  showIcons = true,
  indent = 20,
  className = '',
}) => {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());
  
  const expandedIds = expandedNodeIds.size > 0 ? expandedNodeIds : internalExpandedIds;
  
  const toggleNode = useCallback((nodeId: string) => {
    if (onToggleExpand) {
      onToggleExpand(nodeId);
    } else {
      setInternalExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    }
  }, [onToggleExpand]);
  
  const handleNodeClick = (node: TreeNode, event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeClick?.(node);
    
    if (node.children && node.children.length > 0) {
      toggleNode(node.id);
    }
  };
  
  const handleNodeDoubleClick = (node: TreeNode, event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeDoubleClick?.(node);
  };
  
  const handleNodeRightClick = (node: TreeNode, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onNodeRightClick?.(node, event);
  };
  
  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;
    
    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer
            hover:bg-gray-100 rounded
            transition-colors duration-150
            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${level * indent}px` }}
          onClick={(e) => handleNodeClick(node, e)}
          onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
          onContextMenu={(e) => handleNodeRightClick(node, e)}
        >
          {/* Expand/Collapse Arrow */}
          {hasChildren && (
            <span className="inline-flex w-4 h-4 items-center justify-center mr-1">
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
          
          {/* Spacer for nodes without children */}
          {!hasChildren && <span className="inline-block w-4 mr-1" />}
          
          {/* Icon */}
          {showIcons && node.icon && (
            <span className="inline-flex mr-2 text-gray-500">
              {node.icon}
            </span>
          )}
          
          {/* Label */}
          <span className="flex-1 truncate text-sm">
            {node.label}
          </span>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={`tree-view ${className}`}>
      {data.map(node => renderNode(node, 0))}
    </div>
  );
};

// Default Icons
export const FolderIcon: React.FC<{ open?: boolean }> = ({ open = false }) => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    {open ? (
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    ) : (
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    )}
  </svg>
);

export const FileIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

// Example usage:
/*
const fileTree: TreeNode[] = [
  {
    id: '1',
    label: 'src',
    isDirectory: true,
    icon: <FolderIcon />,
    children: [
      {
        id: '2',
        label: 'components',
        isDirectory: true,
        icon: <FolderIcon />,
        children: [
          { id: '3', label: 'App.tsx', icon: <FileIcon />, path: 'src/components/App.tsx' },
          { id: '4', label: 'Button.tsx', icon: <FileIcon />, path: 'src/components/Button.tsx' },
        ],
      },
      { id: '5', label: 'index.ts', icon: <FileIcon />, path: 'src/index.ts' },
    ],
  },
  {
    id: '6',
    label: 'package.json',
    icon: <FileIcon />,
    path: 'package.json',
  },
];

<TreeView
  data={fileTree}
  onNodeClick={(node) => console.log('Clicked:', node)}
  onNodeDoubleClick={(node) => console.log('Double clicked:', node)}
  onNodeRightClick={(node, e) => console.log('Right clicked:', node)}
  selectedNodeId={selectedId}
  showIcons
/>
*/
