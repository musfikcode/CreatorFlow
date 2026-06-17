import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { deepseekChannel } from "@/inngest/channels/deepseek";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
  try {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);
    return safeString;
  } catch (error) {
    throw new Error(
      `Failed to serialize context to JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});

type DeepseekData = {
  variableName?: string;
  credentialId?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const deepseekExecutor: NodeExecutor<DeepseekData> = async ({
  data,
  context,
  step,
  userId,
  publish,
  nodeId,
}) => {
  await publish(
    deepseekChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Deepseek node: Variable name is required");
  }

  if (!data.credentialId) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Deepseek node: Credential is required");
  }

  const credential = await step.run("get-credential", () => {
    return prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
  });

  if (!credential) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Deepseek node: Credential not found");
  }

  if (!data.userPrompt) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Deepseek node: User prompt is required");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const deepseek = createDeepSeek({
    apiKey: decrypt(credential.value),
  });

  try {
    const { steps } = await step.ai.wrap(
      "deepseek-generate-text",
      generateText,
      {
        model: deepseek("deepseek-chat"),
        system: systemPrompt,
        prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );

    const text =
      steps?.[0]?.content?.[0]?.type === "text" ? steps[0].content[0].text : "";

    await publish(
      deepseekChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      ...context,
      [data.variableName]: {
        text,
      },
    };
  } catch (error) {
    await publish(
      deepseekChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
