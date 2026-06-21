import type { MaybePromise, Realtime } from "@inngest/realtime";
import { NonRetriableError } from "inngest";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { ExecutionStatus, type NodeType } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { anthropicChannel } from "./channels/anthropic";
import { deepseekChannel } from "./channels/deepseek";
import { discordChannel } from "./channels/discord";
import { geminiChannel } from "./channels/gemini";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { openaiChannel } from "./channels/openai";
import { slackChannel } from "./channels/slack";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { inngest } from "./client";
import { topologicalSort } from "./utils";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event }) => {
      return prisma.execution.update({
        where: {
          inngestEventId: event.data.event.id,
        },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel,
      manualTriggerChannel,
      googleFormTriggerChannel,
      stripeTriggerChannel,
      geminiChannel,
      openaiChannel,
      anthropicChannel,
      deepseekChannel,
      discordChannel,
      slackChannel,
    ],
  },
  async ({ event, step, ...ctx }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId as string;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or Workflow ID is missing");
    }

    // Extract publish function from context if available (provided by realtime middleware)
    const publish = (ctx as { publish?: Realtime.PublishFn }).publish;

    // Create default no-op publish function if realtime is not available
    const publishFn: Realtime.PublishFn =
      publish ||
      (<TMessage extends MaybePromise<Realtime.Message.Input>>(
        _message: TMessage,
      ): Promise<Awaited<TMessage>["data"]> => {
        // No-op: Realtime not available
        return Promise.resolve({} as Awaited<TMessage>["data"]);
      });

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        },
      });
    });

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: workflowId,
        },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: workflowId,
        },
        select: {
          userId: true,
        },
      });

      return workflow.userId;
    });

    // Initialize the context with any initial data from the trigger
    let context = event.data.context || {};

    // Execute each node
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        userId,
        context,
        step,
        publish: publishFn,
      });
    }

    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: {
          inngestEventId,
          workflowId,
        },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);
