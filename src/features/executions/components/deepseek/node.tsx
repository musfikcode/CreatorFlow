"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { DEEPSEEK_CHANNEL_NAME } from "@/inngest/channels/deepseek";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchDeepSeekRealtimeToken } from "./actions";
import { DeepSeekDialog, type DeepSeekFormValues } from "./dialog";

type DeepSeekNodeData = {
  variableName?: string;
  credentialId?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

type DeepSeekNodeType = Node<DeepSeekNodeData>;

export const DeepSeekNode = memo((props: NodeProps<DeepSeekNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: DEEPSEEK_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchDeepSeekRealtimeToken,
  });
  const handleOpenSettings = () => {
    setDialogOpen(true);
  };
  const handleSubmit = (values: DeepSeekFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }
        return node;
      }),
    );
    setDialogOpen(false);
  };
  const nodeData = props.data;
  const description = nodeData?.userPrompt
    ? `"deepseek/deepseek-r1-0528:free": ${nodeData.userPrompt.slice(0, 50)}${nodeData.userPrompt.length > 50 ? "..." : ""}`
    : "Not configured";

  return (
    <>
      <DeepSeekDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        name="DeepSeek"
        status={nodeStatus}
        icon="/images/logos/deepseek.svg"
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

DeepSeekNode.displayName = "DeepSeekNode";
