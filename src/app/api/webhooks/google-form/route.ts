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

    const formData = {
      formId: body.formId,
      formTitle: body.formTitle,
      responseId: body.responseId,
      timestamp: body.timestamp,
      respondentEmail: body.respondentEmail,
      responses: body.responses,
      raw: body,
    };

    // Trigger an inngest job
    await sendWorkflowExecution({
      workflowId,
      context: {
        googleForm: formData,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Google Form Webhook Error: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission." },
      { status: 500 },
    );
  }
}
