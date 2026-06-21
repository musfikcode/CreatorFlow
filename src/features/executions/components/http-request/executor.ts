import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { httpRequestChannel } from "@/inngest/channels/http-request";

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

// Helper to access nested properties by path string, handling special characters
Handlebars.registerHelper("get", (obj, path) => {
  if (!path || typeof path !== "string") return undefined;

  // Support both dot notation and array-like paths
  // Examples: "responses.url", "responses.[url ?]"
  const keys = path.match(/[^.[\]]+/g) || [];

  let result = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key as keyof typeof result];
    } else {
      return undefined;
    }
  }
  return result;
});

type HttpRequestData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  context,
  step,
  publish,
  nodeId,
}) => {
  await publish(
    httpRequestChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  const stepId =
    typeof (context as { nodeId: string })?.nodeId === "string"
      ? `http-request-${(context as { nodeId: string }).nodeId}`
      : "http-request";

  try {
    const result = await step.run(stepId, async () => {
      if (!data.endpoint) {
        await publish(
          httpRequestChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError(
          "HTTP Request Node: No endpoint configured.",
        );
      }

      if (!data.variableName) {
        await publish(
          httpRequestChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError(
          "HTTP Request Node: No variable name configured.",
        );
      }

      if (!data.method) {
        await publish(
          httpRequestChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError("HTTP Request Node: No method configured.");
      }

      let endpoint: string;

      try {
        const template = Handlebars.compile(data.endpoint);
        endpoint = template(context);

        // Trim the endpoint to handle whitespace-only strings
        if (typeof endpoint === "string") {
          endpoint = endpoint.trim();
        }

        if (
          !endpoint ||
          typeof endpoint !== "string" ||
          endpoint.length === 0
        ) {
          throw new Error(
            `Endpoint template must resolve to a non-empty string. Template: "${data.endpoint}", Resolved to: "${endpoint}". Available context keys: ${JSON.stringify(Object.keys(context))}`,
          );
        }
      } catch (error) {
        throw new NonRetriableError(
          `HTTP Request Node: Failed to resolve endpoint template: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const method = data.method;

      const options: KyOptions = {
        method,
        timeout: 30000, // 30 second timeout
      };

      if (["POST", "PUT", "PATCH"].includes(method)) {
        const bodyTemplate = data.body || "{}";
        const resolved = Handlebars.compile(bodyTemplate)(context);

        try {
          const parsed = JSON.parse(resolved);
          options.json = parsed;
        } catch (parseError) {
          throw new NonRetriableError(
            `HTTP Request Node: Invalid JSON in request body. Template: "${bodyTemplate}", Resolved: "${resolved}". Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
        }
      }

      const response = await ky(endpoint, options);
      const contentType = response.headers.get("content-type");
      const responseData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      const responsePayload = {
        httpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      };
      return {
        ...context,
        [data.variableName]: responsePayload,
      };
    });

    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "success",
      }),
    );
    return result;
  } catch (error) {
    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
