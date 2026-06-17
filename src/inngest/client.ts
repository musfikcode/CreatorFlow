import { realtimeMiddleware } from "@inngest/realtime/middleware";
import { Inngest } from "inngest";

// Create a client to send and receive events
if (!process.env.INNGEST_EVENT_KEY) {
  throw new Error("INNGEST EVENT KEY environment variable is required");
}
export const inngest = new Inngest({
  id: "creambon",
  eventKey: process.env.INNGEST_EVENT_KEY,
  middleware: [realtimeMiddleware()],
});
