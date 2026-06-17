import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/app/api/trpc/client";
import { useWorkflowsParams } from "./use-workflows-params";

/*
 * Hook to fetch all workflows using suspense
 */

export const useSuspenseWorkflows = () => {
  const trpc = useTRPC();
  const [params] = useWorkflowsParams();

  return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
};

/**
 * Hook to create a new workflow
 */

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" created successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to create workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to update a workflow name
 */

export const useUpdateWorkflowName = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.updateName.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" updated successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getOne.queryKey({ id: data.id }),
        });
      },
      onError: (error) => {
        toast.error(`Failed to update workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to remove a workflow
 */

export const useRemoveWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" removed successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getOne.queryKey({ id: data.id }),
        });
      },
      onError: (error) => {
        toast.error(`Failed to remove workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to fetch a single workflow using suspense
 */

export const useSuspenseWorkflow = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }));
};

/**
 * Hook to update a workflow
 */

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" saved successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getOne.queryKey({ id: data.id }),
        });
      },
      onError: (error) => {
        toast.error(`Failed to save workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to execute a workflow
 */

export const useExecuteWorkflow = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.execute.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" queued for execution`);
      },
      onError: (error) => {
        toast.error(`Failed to execute workflow: ${error.message}`);
      },
    }),
  );
};
