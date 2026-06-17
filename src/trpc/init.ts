import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: "user_123" };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  return next({ ctx: { ...ctx, auth: session } });
});
// Simple in-memory cache for Polar customer state to avoid calling
// the external API on every request. Entries are short-lived.
const POLAR_CUSTOMER_CACHE_TTL_MS = 10_000; // 10 seconds - short TTL for faster subscription updates
const polarCustomerCache = new Map<
  string,
  {
    customer: Awaited<
      ReturnType<typeof polarClient.customers.getStateExternal>
    >;
    expiresAt: number;
  }
>();
async function getCustomerStateForUser(userId: string) {
  const now = Date.now();
  const cached = polarCustomerCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.customer;
  }
  const customer = await polarClient.customers.getStateExternal({
    externalId: userId,
  });
  polarCustomerCache.set(userId, {
    customer,
    expiresAt: now + POLAR_CUSTOMER_CACHE_TTL_MS,
  });
  return customer;
}
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const userId = ctx.auth.user.id;
    const customer = await getCustomerStateForUser(userId);

    // Check if user has an active subscription
    const hasActiveSubscription =
      customer.activeSubscriptions && customer.activeSubscriptions.length > 0;

    if (!hasActiveSubscription) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This feature requires a Pro subscription",
      });
    }

    return next({ ctx: { ...ctx, customer } });
  },
);
