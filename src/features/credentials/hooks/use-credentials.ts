import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/app/api/trpc/client";
import type { CredentialType } from "@/generated/prisma/enums";
import { useCredentialsParams } from "./use-credentials-params";

/*
 * Hook to fetch all credentials using suspense
 */

export const useSuspenseCredentials = () => {
  const trpc = useTRPC();
  const [params] = useCredentialsParams();

  return useSuspenseQuery(trpc.credentials.getMany.queryOptions(params));
};

/**
 * Hook to create a new credential
 */

export const useCreateCredential = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.credentials.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" created successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getByType.queryKey({ type: data.type }),
        });
      },
      onError: (error) => {
        toast.error(`Failed to create credential: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to remove a credential
 */

export const useRemoveCredentials = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.credentials.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" removed successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getOne.queryKey({ id: data.id }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getByType.queryKey({ type: data.type }),
        });
      },
      onError: (error) => {
        toast.error(`Failed to remove credential: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to fetch a single credential using suspense
 */

export const useSuspenseCredential = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.credentials.getOne.queryOptions({ id }));
};

/**
 * Hook to update a credential
 */

export const useUpdateCredential = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.credentials.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" saved successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.credentials.getOne.queryKey({ id: data.id }),
        });
      },
      onError: (error) => {
        toast.error(`Failed to save credential: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to fetch credentials by type
 */

export const useCredentialsByType = (type: CredentialType) => {
  const trpc = useTRPC();

  return useQuery(trpc.credentials.getByType.queryOptions({ type }));
};
