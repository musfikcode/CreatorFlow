"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { ReactNode } from "react";

import { BaseNode } from "./base-node";

export type PlaceholderNodeProps = Partial<NodeProps> & {
  children?: ReactNode;
  onClick?: (nodeId: string) => void;
};

export function PlaceholderNode({
  id,
  children,
  onClick,
}: PlaceholderNodeProps) {
  return (
    <BaseNode
      className="bg-card w-auto h-auto border-dashed border-gray-400 p-4 text-center text-gray-400 shadow-none cursor-pointer hover:border-gray-500 hover:bg-gray-50"
      onClick={() => id && onClick?.(id)}
    >
      {children}
      <Handle
        type="target"
        style={{ visibility: "hidden" }}
        position={Position.Top}
        isConnectable={false}
      />
      <Handle
        type="source"
        style={{ visibility: "hidden" }}
        position={Position.Bottom}
        isConnectable={false}
      />
    </BaseNode>
  );
}
