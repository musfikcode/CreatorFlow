"use client";

import { useAtomValue } from "jotai";
import { FlaskConicalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExecuteWorkflow, useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import { editorAtom } from "../store/atom";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();
  const executeWorkflow = useExecuteWorkflow();

  const handleExecute = async () => {
    // Auto-save the latest node config before executing
    if (editor) {
      await saveWorkflow.mutateAsync({
        id: workflowId,
        nodes: editor.getNodes(),
        edges: editor.getEdges(),
      });
    }
    executeWorkflow.mutate({ id: workflowId });
  };

  const isPending = saveWorkflow.isPending || executeWorkflow.isPending;

  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={isPending}
    >
      <FlaskConicalIcon className="size-4" />
      Execute Workflow
    </Button>
  );
};
