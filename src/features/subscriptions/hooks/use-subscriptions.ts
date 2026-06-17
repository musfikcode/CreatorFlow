import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const useSubscriptions = () => {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      try {
        const { data } = await authClient.customer.state();
        if (!data) {
          return null;
        }
        return data;
      } catch (error) {
        console.error(
          "Failed to fetch customer state in useSubscriptions:",
          error,
        );
        return null;
      }
    },
  });
};

export const useHasSubscription = () => {
  const { data: customerState, isLoading, ...rest } = useSubscriptions();

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0;

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions
      ? customerState.activeSubscriptions[0]
      : null,
    isLoading,
    ...rest,
  };
};
