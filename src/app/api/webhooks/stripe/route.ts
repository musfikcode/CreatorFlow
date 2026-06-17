import { type NextRequest, NextResponse } from "next/server";
import { sendWorkflowExecution } from "@/inngest/utils";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: "Workflow ID is missing." },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.formId || !body.responseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields (formId, responseId).",
        },
        { status: 400 },
      );
    }

    const stripeData = {
      // Event metadata

      eventId: body.id,
      eventType: body.type,
      eventTimestamp: body.created,
      eventLivemode: body.livemode,
      eventRequest: body.request,
      eventWebhook: body.webhook,
      eventWebhookDelivery: body.webhook_delivery,
      raw: body.data?.object,
    };

    // Trigger an inngest job
    await sendWorkflowExecution({
      workflowId,
      context: {
        stripe: stripeData,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe Webhook Error: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Stripe event." },
      { status: 500 },
    );
  }
}
